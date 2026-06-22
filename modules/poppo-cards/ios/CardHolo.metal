#include <metal_stdlib>
using namespace metal;

constant float kCardPlaneWidth = 2.0;
constant float kCardPlaneHeight = 2.8;

struct SCNNodeUniforms {
  float4x4 modelTransform;
  float4x4 modelViewProjectionTransform;
  float4x4 normalTransform;
  float4x4 modelViewTransform;
  float4x4 inverseModelViewTransform;
};

struct VertexIn {
  float3 position [[attribute(0)]];
  float3 normal [[attribute(1)]];
  float2 texCoord [[attribute(3)]];
};

struct VertexOut {
  float4 position [[position]];
  float2 texCoord;
  float3 worldNormal;
  float3 viewDirection;
};

struct CardHoloUniforms {
  float3 lightDirection;
  float2 viewAngle;
  float holoIntensity;
  float hueShift;
  float shininess;
  float fresnelPower;
  float3 baseTint;
  float cornerRadius;
};

inline float3 hueToRgb(float hue) {
  float3 rgb = float3(
    abs(hue * 6.0 - 3.0) - 1.0,
    2.0 - abs(hue * 6.0 - 2.0),
    2.0 - abs(hue * 6.0 - 4.0)
  );
  return saturate(rgb);
}

inline float roundedRectMask(float2 uv, float2 size, float radius) {
  float2 halfSize = size * 0.5;
  float2 centered = (uv - 0.5) * size;
  float2 q = abs(centered) - halfSize + radius;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(-0.01, 0.02, dist);
}

inline float ggxSpecular(float3 N, float3 L, float3 V, float roughness) {
  float3 H = normalize(L + V);
  float NdotH = saturate(dot(N, H));
  float NdotV = saturate(dot(N, V));
  float NdotL = saturate(dot(N, L));
  float alpha = roughness * roughness;
  float alpha2 = alpha * alpha;
  float denom = (NdotH * NdotH) * (alpha2 - 1.0) + 1.0;
  float D = alpha2 / max(3.14159 * denom * denom, 0.0001);
  float k = (roughness + 1.0);
  k = (k * k) / 8.0;
  float G1V = NdotV / (NdotV * (1.0 - k) + k);
  float G1L = NdotL / (NdotL * (1.0 - k) + k);
  return D * G1V * G1L;
}

inline float hash21(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

inline float lameFlake(
  float2 uv,
  float2 viewAngle,
  float density,
  float scale,
  float gateBias,
  float holoIntensity
) {
  float2 grid = uv * density;
  float2 cell = floor(grid);
  float2 local = fract(grid) - 0.5;

  float h = hash21(cell);
  float h2 = hash21(cell + 41.17);
  float angle = h * 6.2831853 + viewAngle.x * 1.35 + viewAngle.y * 0.95;
  float c = cos(angle);
  float s = sin(angle);
  float2 rot = float2(c * local.x - s * local.y, s * local.x + c * local.y);

  float2 halfSize = float2(0.07 + h2 * 0.14, 0.018 + h * 0.035) * scale;
  float2 d = abs(rot) - halfSize;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);

  float gate = step(gateBias - holoIntensity * 0.1, h);
  float body = gate * smoothstep(0.028, 0.0, dist);
  float shimmer = 0.45 + 0.55 * sin(angle * 2.0 + dot(viewAngle, float2(1.6, 1.1)) * 4.2);
  return body * shimmer;
}

inline float3 lameColor(float hueSeed, float holoIntensity, float3 baseTint) {
  float hue = fract(hueSeed + baseTint.x * 0.2 + baseTint.y * 0.15);
  float3 iridescent = hueToRgb(hue);
  float3 silver = float3(0.92, 0.95, 1.0);
  float3 gold = float3(1.0, 0.88, 0.45);
  float3 mixA = mix(silver, gold, smoothstep(0.35, 0.85, holoIntensity));
  return mix(mixA, iridescent, 0.42 + holoIntensity * 0.25);
}

vertex VertexOut cardHoloVertex(
  VertexIn in [[stage_in]],
  constant SCNNodeUniforms& scn_node [[buffer(0)]]
) {
  VertexOut out;
  float4 worldPos = scn_node.modelTransform * float4(in.position, 1.0);
  out.position = scn_node.modelViewProjectionTransform * float4(in.position, 1.0);
  out.worldNormal = normalize((scn_node.normalTransform * float4(in.normal, 0.0)).xyz);
  float3 cameraPos = float3(
    scn_node.inverseModelViewTransform[3][0],
    scn_node.inverseModelViewTransform[3][1],
    scn_node.inverseModelViewTransform[3][2]
  );
  out.viewDirection = normalize(cameraPos - worldPos.xyz);
  out.texCoord = in.texCoord;
  return out;
}

fragment float4 cardHoloFragment(
  VertexOut in [[stage_in]],
  constant CardHoloUniforms& uniforms [[buffer(1)]],
  texture2d<float> diffuseTexture [[texture(0)]],
  sampler texSampler [[sampler(0)]]
) {
  float mask = roundedRectMask(
    in.texCoord,
    float2(1.0, kCardPlaneHeight / kCardPlaneWidth),
    uniforms.cornerRadius
  );
  if (mask < 0.01) {
    discard_fragment();
  }

  float4 baseSample = diffuseTexture.sample(texSampler, in.texCoord);
  float lum = dot(baseSample.rgb, float3(0.299, 0.587, 0.114));
  float textGuard = smoothstep(0.08, 0.38, lum);
  float foilBoost = smoothstep(0.32, 0.92, lum);
  float holoMask = max(textGuard * 0.75, foilBoost);
  float3 baseColor = mix(uniforms.baseTint * 0.16, baseSample.rgb, 0.97);

  float3 N = normalize(in.worldNormal);
  float3 L = normalize(uniforms.lightDirection);
  float3 V = normalize(in.viewDirection);

  float gratingX = sin(in.texCoord.x * 620.0 + uniforms.viewAngle.x * 18.0) * 0.5 + 0.5;
  float gratingY = sin(in.texCoord.y * 820.0 + uniforms.viewAngle.y * 14.0) * 0.5 + 0.5;
  float grating = pow(gratingX * gratingY, 1.35);

  float diag = sin((in.texCoord.x + in.texCoord.y) * 340.0 + uniforms.hueShift * 2.4) * 0.5 + 0.5;
  float fine = sin(in.texCoord.x * 1200.0 + in.texCoord.y * 980.0 + uniforms.viewAngle.x * 22.0) * 0.5 + 0.5;

  float diffraction = dot(N, V) * 0.5 + dot(L, V) * 0.35;
  float hue = fract(
    uniforms.hueShift
    + diffraction * 1.6
    + in.texCoord.x * 0.42
    + in.texCoord.y * 0.28
    + grating * 0.22
    + diag * 0.14
    + uniforms.viewAngle.x * 0.16
  );
  float3 rainbow = hueToRgb(hue);

  float fresnel = pow(1.0 - saturate(dot(N, V)), uniforms.fresnelPower);
  float spec = ggxSpecular(N, L, V, 1.0 - uniforms.shininess);
  float holoAmp = uniforms.holoIntensity * (1.0 + spec * 1.8);

  float3 holo = rainbow * (grating * 0.7 + diag * 0.35 + fine * 0.18)
    * holoAmp * (0.42 + spec * 1.4) * holoMask;
  float3 rim = rainbow * fresnel * holoAmp * 0.85 * holoMask;
  float3 lit = baseColor + holo + rim;

  float lameFine = lameFlake(in.texCoord, uniforms.viewAngle, 95.0, 1.0, 0.78, uniforms.holoIntensity);
  float lameMid = lameFlake(in.texCoord + float2(0.13, 0.07), uniforms.viewAngle, 58.0, 1.35, 0.72, uniforms.holoIntensity);
  float lameBold = lameFlake(in.texCoord + float2(0.31, 0.19), uniforms.viewAngle, 34.0, 1.85, 0.66, uniforms.holoIntensity);
  float lameAmt = (lameFine * 0.55 + lameMid * 0.75 + lameBold * 0.95) * holoMask;

  float2 lameCell = floor(in.texCoord * float2(58.0, 82.0));
  float lameHueSeed = hash21(lameCell) + uniforms.hueShift + diffraction * 0.35;
  float3 lameTint = lameColor(lameHueSeed, uniforms.holoIntensity, uniforms.baseTint);
  lit += lameTint * lameAmt * holoAmp * 2.6;

  float2 sparkleUV = in.texCoord * float2(220.0, 310.0);
  float2 sparkleCell = floor(sparkleUV);
  float sparkleHash = fract(sin(dot(sparkleCell, float2(12.9898, 78.233))) * 43758.5453);
  float sparkleGate = step(0.9 - uniforms.holoIntensity * 0.08, sparkleHash);
  float2 sparkleLocal = fract(sparkleUV) - 0.5;
  float sparkleDist = length(sparkleLocal);
  float sparkle = sparkleGate * smoothstep(0.12, 0.0, sparkleDist);
  float sparkleHue = fract(sparkleHash * 5.1 + uniforms.hueShift + diffraction);
  lit += hueToRgb(sparkleHue) * sparkle * holoAmp * 2.2 * holoMask;

  float phong = pow(saturate(dot(N, L)), uniforms.shininess * 120.0);
  lit += float3(1.0) * phong * (0.22 + uniforms.holoIntensity * 0.18);
  lit += float3(1.0) * pow(spec, 3.0) * 0.35 * holoMask;

  return float4(lit, baseSample.a * mask);
}

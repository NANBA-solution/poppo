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
  float3 baseColor = mix(uniforms.baseTint * 0.25, baseSample.rgb, 0.92);

  float3 N = normalize(in.worldNormal);
  float3 L = normalize(uniforms.lightDirection);
  float3 V = normalize(in.viewDirection);

  float gratingX = sin(in.texCoord.x * 520.0 + uniforms.viewAngle.x * 14.0) * 0.5 + 0.5;
  float gratingY = sin(in.texCoord.y * 680.0 + uniforms.viewAngle.y * 11.0) * 0.5 + 0.5;
  float grating = pow(gratingX * gratingY, 1.6);

  float diffraction = dot(N, V) * 0.5 + dot(L, V) * 0.35;
  float hue = fract(
    uniforms.hueShift
    + diffraction * 1.4
    + in.texCoord.x * 0.35
    + in.texCoord.y * 0.22
    + grating * 0.18
    + uniforms.viewAngle.x * 0.12
  );
  float3 rainbow = hueToRgb(hue);

  float fresnel = pow(1.0 - saturate(dot(N, V)), uniforms.fresnelPower);
  float spec = ggxSpecular(N, L, V, 1.0 - uniforms.shininess);

  float3 holo = rainbow * grating * uniforms.holoIntensity * (0.35 + spec * 1.2);
  float3 rim = rainbow * fresnel * uniforms.holoIntensity * 0.55;
  float3 lit = baseColor + holo + rim;

  float phong = pow(saturate(dot(N, L)), uniforms.shininess * 96.0);
  lit += float3(1.0) * phong * 0.18;

  return float4(lit, baseSample.a * mask);
}

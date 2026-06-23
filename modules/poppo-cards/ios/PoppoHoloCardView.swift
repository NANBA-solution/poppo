import ExpoModulesCore
import SwiftUI
import UIKit

final class PoppoHoloCardView: ExpoView {
  private let hosting: UIHostingController<ContentView>
  private var pendingRefresh = false
  private var refreshQueued = false
  private var currentFaces: [CardFaceData] = []

  var layoutName = "single"
  var rarityName = "common"
  var leftRarityName = "common"
  var centerRarityName = "rare"
  var rightRarityName = "legendary"

  var imageUri: String?
  var leftImageUri: String?
  var centerImageUri: String?
  var rightImageUri: String?

  var cardName = ""
  var typeLong = ""
  var profile = ""
  var rarityLabel = "N"
  var serial = "No.000"
  var starCount = 1
  var hp = "0"
  var retreatCost = "1"
  var hpLabel = "HP"
  var retreatLabel = ""
  var move1Name = ""
  var move1Damage = "0"
  var move1Cost = ""
  var move2Name = ""
  var move2Damage = ""
  var move2Cost = ""
  var moveDescription = ""
  var move2Description = ""
  var moveTraitLabel = "特徴"
  var imageScale: Float = 1
  var imageOffsetX: Float = 0
  var imageOffsetY: Float = 0
  var flavor = ""
  var brandLine = ""
  var showMove2 = false
  var showMoveDesc = false
  var showMove2Desc = false
  var showMeta = true
  var showProfile = true
  var showStats = true
  var showCosts = true
  var showBrand = true
  var isActive = true
  var qualityName = "full"

  required init(appContext: AppContext? = nil) {
    hosting = UIHostingController(
      rootView: ContentView(
        faces: [],
        layout: .single,
        isActive: true,
        quality: .full
      )
    )
    super.init(appContext: appContext)
    hosting.view.backgroundColor = .clear
    hosting.view.isOpaque = false
    addSubview(hosting.view)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hosting.view.frame = bounds
  }

  func setActive(_ active: Bool) {
    guard isActive != active else { return }
    isActive = active
    updateRuntimeState()
  }

  func updateRuntimeState() {
    hosting.rootView = ContentView(
      faces: currentFaces,
      layout: layoutKind,
      isActive: isActive,
      quality: qualityKind
    )
  }

  func refreshContent() {
    if pendingRefresh {
      refreshQueued = true
      return
    }
    pendingRefresh = true

    let layout = layoutKind
    let uris: [String?]
    let rarities: [CardRarity]
    let maxPixelSize: CGFloat? = qualityKind == .compact ? 256 : nil

    switch layout {
    case .single:
      uris = [imageUri]
      rarities = [CardRarity(raw: rarityName)]
    case .trio:
      uris = [leftImageUri, centerImageUri, rightImageUri]
      rarities = [
        CardRarity(raw: leftRarityName),
        CardRarity(raw: centerRarityName),
        CardRarity(raw: rightRarityName),
      ]
    }

    let group = DispatchGroup()
    var photos: [UIImage?] = Array(repeating: nil, count: uris.count)

    for (index, uri) in uris.enumerated() {
      group.enter()
      CardImageLoader.load(from: uri, maxPixelSize: maxPixelSize) { image in
        photos[index] = image
        group.leave()
      }
    }

    group.notify(queue: .main) { [weak self] in
      guard let self else { return }
      self.pendingRefresh = false

      let faces: [CardFaceData]
      switch layout {
      case .single:
        faces = [
          self.makeFace(photo: photos.first ?? nil, rarity: rarities.first ?? .common),
        ]
      case .trio:
        faces = zip(photos, rarities).map { photo, rarity in
          self.makeFace(photo: photo, rarity: rarity, useDefaults: true)
        }
      }

      self.currentFaces = faces
      self.hosting.rootView = ContentView(
        faces: faces,
        layout: layout,
        isActive: self.isActive,
        quality: self.qualityKind
      )

      if self.refreshQueued {
        self.refreshQueued = false
        self.refreshContent()
      }
    }
  }

  private var layoutKind: CardLayoutKind {
    layoutName == "trio" ? .trio : .single
  }

  private var qualityKind: CardQualityKind {
    qualityName == "compact" ? .compact : .full
  }

  private func makeFace(photo: UIImage?, rarity: CardRarity, useDefaults: Bool = false) -> CardFaceData {
    if useDefaults {
      return CardFaceData(
        photo: photo,
        rarity: rarity,
        rarityLabel: rarity == .legendary ? "SR" : (rarity == .rare ? "R" : "N"),
        typeLong: "路上ハト",
        profile: "高さ 気分次第",
        name: "POPPO",
        serial: "No.000",
        starCount: rarity == .legendary ? 5 : (rarity == .rare ? 3 : 1),
        hp: "70",
        retreatCost: "1",
        hpLabel: "HP",
        retreatLabel: "にげる",
        move1Name: "ぽっぽスマイル",
        move1Damage: "30",
        move1Cost: "",
        move2Name: "もふもふウィング",
        move2Damage: "50",
        move2Cost: "",
        moveDescription: "ぽっぽっと鳴いただけなのに、胸がきゅんとする。",
        move2Description: "羽を広げると、公園の空気がふわっとやわらかくなる。",
        moveTraitLabel: "特徴",
        imageScale: 1,
        imageOffsetX: 0,
        imageOffsetY: 0,
        flavor: "公園の風にのって、ふわっとやさしい一羽。",
        brandLine: "POPPO",
        showMove2: rarity != .common,
        showMoveDesc: rarity != .common,
        showMove2Desc: rarity == .legendary,
        showMeta: true,
        showProfile: rarity != .common,
        showStats: true,
        showCosts: false,
        showBrand: true
      )
    }

    return CardFaceData(
      photo: photo,
      rarity: rarity,
      rarityLabel: rarityLabel.isEmpty ? "N" : rarityLabel,
      typeLong: typeLong.isEmpty ? "POPPO" : typeLong,
      profile: profile,
      name: cardName.isEmpty ? "POPPO" : cardName,
      serial: serial.isEmpty ? "No.000" : serial,
      starCount: max(1, min(5, starCount)),
      hp: hp.isEmpty ? "0" : hp,
      retreatCost: retreatCost.isEmpty ? "1" : retreatCost,
      hpLabel: hpLabel.isEmpty ? "HP" : hpLabel,
      retreatLabel: retreatLabel,
      move1Name: move1Name.isEmpty ? "—" : move1Name,
      move1Damage: move1Damage.isEmpty ? "0" : move1Damage,
      move1Cost: move1Cost,
      move2Name: move2Name,
      move2Damage: move2Damage,
      move2Cost: move2Cost,
      moveDescription: moveDescription,
      move2Description: move2Description,
      moveTraitLabel: moveTraitLabel.isEmpty ? "特徴" : moveTraitLabel,
      imageScale: imageScale,
      imageOffsetX: imageOffsetX,
      imageOffsetY: imageOffsetY,
      flavor: flavor,
      brandLine: brandLine.isEmpty ? "POPPO" : brandLine,
      showMove2: showMove2,
      showMoveDesc: showMoveDesc,
      showMove2Desc: showMove2Desc,
      showMeta: showMeta,
      showProfile: showProfile,
      showStats: showStats,
      showCosts: showCosts,
      showBrand: showBrand
    )
  }
}

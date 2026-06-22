import ExpoModulesCore
import SwiftUI
import UIKit

final class PoppoHoloCardView: ExpoView {
  private let hosting: UIHostingController<ContentView>
  private var pendingRefresh = false

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
  var rarityLabel = "N"
  var serial = "No.000"
  var starCount = 1
  var move1Name = ""
  var move1Damage = "0"
  var move2Name = ""
  var move2Damage = ""
  var moveDescription = ""
  var flavor = ""
  var showMove2 = false
  var showMoveDesc = false

  required init(appContext: AppContext? = nil) {
    hosting = UIHostingController(
      rootView: ContentView(
        faces: [],
        layout: .single
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

  func refreshContent() {
    guard !pendingRefresh else { return }
    pendingRefresh = true

    let layout = layoutKind
    let uris: [String?]
    let rarities: [CardRarity]

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
      CardImageLoader.load(from: uri) { image in
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

      self.hosting.rootView = ContentView(faces: faces, layout: layout)
    }
  }

  private var layoutKind: CardLayoutKind {
    layoutName == "trio" ? .trio : .single
  }

  private func makeFace(photo: UIImage?, rarity: CardRarity, useDefaults: Bool = false) -> CardFaceData {
    if useDefaults {
      return CardFaceData(
        photo: photo,
        rarity: rarity,
        rarityLabel: rarity == .legendary ? "SR" : (rarity == .rare ? "R" : "N"),
        name: "POPPO",
        serial: "No.000",
        starCount: rarity == .legendary ? 5 : (rarity == .rare ? 3 : 1),
        move1Name: "はとパンチ",
        move1Damage: "30",
        move2Name: "つばさビーム",
        move2Damage: "50",
        moveDescription: "",
        flavor: "街角のハト。",
        showMove2: rarity != .common,
        showMoveDesc: false
      )
    }

    return CardFaceData(
      photo: photo,
      rarity: rarity,
      rarityLabel: rarityLabel.isEmpty ? "N" : rarityLabel,
      name: cardName.isEmpty ? "POPPO" : cardName,
      serial: serial.isEmpty ? "No.000" : serial,
      starCount: max(1, min(5, starCount)),
      move1Name: move1Name.isEmpty ? "—" : move1Name,
      move1Damage: move1Damage.isEmpty ? "0" : move1Damage,
      move2Name: move2Name,
      move2Damage: move2Damage,
      moveDescription: moveDescription,
      flavor: flavor,
      showMove2: showMove2,
      showMoveDesc: showMoveDesc
    )
  }
}

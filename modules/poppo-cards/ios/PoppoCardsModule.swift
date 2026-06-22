import ExpoModulesCore

public class PoppoCardsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PoppoCards")

    View(PoppoHoloCardView.self) {
      ViewName("PoppoHoloCard")

      Prop("layout") { (view: PoppoHoloCardView, layout: String) in
        view.layoutName = layout
      }

      Prop("rarity") { (view: PoppoHoloCardView, rarity: String) in
        view.rarityName = rarity
      }

      Prop("leftRarity") { (view: PoppoHoloCardView, rarity: String) in
        view.leftRarityName = rarity
      }

      Prop("centerRarity") { (view: PoppoHoloCardView, rarity: String) in
        view.centerRarityName = rarity
      }

      Prop("rightRarity") { (view: PoppoHoloCardView, rarity: String) in
        view.rightRarityName = rarity
      }

      Prop("imageUri") { (view: PoppoHoloCardView, uri: String) in
        view.imageUri = uri
      }

      Prop("leftImageUri") { (view: PoppoHoloCardView, uri: String) in
        view.leftImageUri = uri
      }

      Prop("centerImageUri") { (view: PoppoHoloCardView, uri: String) in
        view.centerImageUri = uri
      }

      Prop("rightImageUri") { (view: PoppoHoloCardView, uri: String) in
        view.rightImageUri = uri
      }

      Prop("cardName") { (view: PoppoHoloCardView, name: String) in
        view.cardName = name
      }

      Prop("rarityLabel") { (view: PoppoHoloCardView, label: String) in
        view.rarityLabel = label
      }

      Prop("serial") { (view: PoppoHoloCardView, serial: String) in
        view.serial = serial
      }

      Prop("starCount") { (view: PoppoHoloCardView, count: Int) in
        view.starCount = count
      }

      Prop("move1Name") { (view: PoppoHoloCardView, name: String) in
        view.move1Name = name
      }

      Prop("move1Damage") { (view: PoppoHoloCardView, damage: String) in
        view.move1Damage = damage
      }

      Prop("move2Name") { (view: PoppoHoloCardView, name: String) in
        view.move2Name = name
      }

      Prop("move2Damage") { (view: PoppoHoloCardView, damage: String) in
        view.move2Damage = damage
      }

      Prop("moveDescription") { (view: PoppoHoloCardView, text: String) in
        view.moveDescription = text
      }

      Prop("flavor") { (view: PoppoHoloCardView, text: String) in
        view.flavor = text
      }

      Prop("showMove2") { (view: PoppoHoloCardView, show: Bool) in
        view.showMove2 = show
      }

      Prop("showMoveDesc") { (view: PoppoHoloCardView, show: Bool) in
        view.showMoveDesc = show
      }

      OnViewDidUpdateProps { view in
        view.refreshContent()
      }
    }
  }
}

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

      Prop("typeLong") { (view: PoppoHoloCardView, value: String) in
        view.typeLong = value
      }

      Prop("profile") { (view: PoppoHoloCardView, value: String) in
        view.profile = value
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

      Prop("hp") { (view: PoppoHoloCardView, value: String) in
        view.hp = value
      }

      Prop("retreatCost") { (view: PoppoHoloCardView, value: String) in
        view.retreatCost = value
      }

      Prop("hpLabel") { (view: PoppoHoloCardView, value: String) in
        view.hpLabel = value
      }

      Prop("retreatLabel") { (view: PoppoHoloCardView, value: String) in
        view.retreatLabel = value
      }

      Prop("move1Name") { (view: PoppoHoloCardView, name: String) in
        view.move1Name = name
      }

      Prop("move1Damage") { (view: PoppoHoloCardView, damage: String) in
        view.move1Damage = damage
      }

      Prop("move1Cost") { (view: PoppoHoloCardView, value: String) in
        view.move1Cost = value
      }

      Prop("move2Name") { (view: PoppoHoloCardView, name: String) in
        view.move2Name = name
      }

      Prop("move2Damage") { (view: PoppoHoloCardView, damage: String) in
        view.move2Damage = damage
      }

      Prop("move2Cost") { (view: PoppoHoloCardView, value: String) in
        view.move2Cost = value
      }

      Prop("moveDescription") { (view: PoppoHoloCardView, text: String) in
        view.moveDescription = text
      }

      Prop("move2Description") { (view: PoppoHoloCardView, text: String) in
        view.move2Description = text
      }

      Prop("moveTraitLabel") { (view: PoppoHoloCardView, text: String) in
        view.moveTraitLabel = text
      }

      Prop("imageScale") { (view: PoppoHoloCardView, value: Double) in
        view.imageScale = Float(value)
      }

      Prop("imageOffsetX") { (view: PoppoHoloCardView, value: Double) in
        view.imageOffsetX = Float(value)
      }

      Prop("imageOffsetY") { (view: PoppoHoloCardView, value: Double) in
        view.imageOffsetY = Float(value)
      }

      Prop("flavor") { (view: PoppoHoloCardView, text: String) in
        view.flavor = text
      }

      Prop("brandLine") { (view: PoppoHoloCardView, text: String) in
        view.brandLine = text
      }

      Prop("showMove2") { (view: PoppoHoloCardView, show: Bool) in
        view.showMove2 = show
      }

      Prop("showMoveDesc") { (view: PoppoHoloCardView, show: Bool) in
        view.showMoveDesc = show
      }

      Prop("showMove2Desc") { (view: PoppoHoloCardView, show: Bool) in
        view.showMove2Desc = show
      }

      Prop("showMeta") { (view: PoppoHoloCardView, show: Bool) in
        view.showMeta = show
      }

      Prop("showProfile") { (view: PoppoHoloCardView, show: Bool) in
        view.showProfile = show
      }

      Prop("showStats") { (view: PoppoHoloCardView, show: Bool) in
        view.showStats = show
      }

      Prop("showCosts") { (view: PoppoHoloCardView, show: Bool) in
        view.showCosts = show
      }

      Prop("showBrand") { (view: PoppoHoloCardView, show: Bool) in
        view.showBrand = show
      }

      Prop("isActive") { (view: PoppoHoloCardView, active: Bool) in
        view.setActive(active)
      }

      Prop("quality") { (view: PoppoHoloCardView, quality: String) in
        view.qualityName = quality
        view.refreshContent()
      }

      OnViewDidUpdateProps { view in
        view.refreshContent()
      }
    }
  }
}

import ExpoModulesCore

public class PoppoIconsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PoppoIcons")

    View(PoppoIconView.self) {
      ViewName("PoppoIcon")
      Prop("name") { (view: PoppoIconView, name: String) in
        view.iconName = name
      }

      Prop("size") { (view: PoppoIconView, size: Double) in
        view.iconSize = CGFloat(size)
      }

      Prop("color") { (view: PoppoIconView, color: String) in
        view.iconColorHex = color
      }

      OnViewDidUpdateProps { view in
        view.updateHostedIcon()
      }
    }

    View(PoppoHeroView.self) {
      ViewName("PoppoHero")
      Prop("scene") { (view: PoppoHeroView, scene: String) in
        view.sceneName = scene
      }

      Prop("accentColor") { (view: PoppoHeroView, color: String) in
        view.accentColorHex = color
      }

      OnViewDidUpdateProps { view in
        view.updateHostedHero()
      }
    }
  }
}

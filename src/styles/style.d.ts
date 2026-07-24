import "styled-components";
import { theme } from "./theme";

type ThemeType = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme {
    typography: ThemeType["typography"];
    spacing: ThemeType["spacing"];
    radius: ThemeType["radius"];
    layout: ThemeType["layout"];
    colors: ThemeType["colors"];
    shadow: ThemeType["shadow"];
  }
}

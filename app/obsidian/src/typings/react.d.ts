declare module "react" {
  export type {
    Attributes,
    FunctionalComponent as SFC,
    AnyComponent as ComponentType,
    AnyComponent as JSXElementConstructor,
    ClassAttributes,
    PreactContext as Context,
    PreactProvider as Provider,
    VNode as ReactElement,
    VNode as ReactNode,
    Ref,
    JSX,
    RenderableProps as ComponentPropsWithRef,
  } from "preact";
  export {
    Component as ComponentClass,
    createElement,
    Fragment,
    render,
  } from "preact";
}

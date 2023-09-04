import { useLocalStorageState } from "ahooks";
import ReactDOM from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type ZoteroPlugin from "@/zt-main";
import { SettingTabCtx } from "./common";
import Connect from "./connect";
import General from "./general";
import Misc from "./misc";
import PluginSettingTab from "./patch-tab";
import Suggester from "./suggester";
import Template from "./template";
import Update from "./update";

export default class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
    this.containerEl.addClass("obzt");
  }
  override display(): void {
    super.display();
    ReactDOM.render(
      <SettingTabCtx.Provider
        value={{
          plugin: this.plugin,
          closeTab: () => (this as any).setting.close(),
        }}
      >
        <MainPage />
      </SettingTabCtx.Provider>,
      this.containerEl,
    );
    this.register(() => ReactDOM.unmountComponentAtNode(this.containerEl));
  }
}

export function MainPage() {
  const [value, setValue] = useLocalStorageState<string>("obzt-setting-tab", {
    defaultValue: "general",
  });
  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      className="flex h-full flex-col"
    >
      <TabsList className="self-start max-w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="connect">Connect</TabsTrigger>
        <TabsTrigger value="suggester">Suggester</TabsTrigger>
        <TabsTrigger value="template">Template</TabsTrigger>
        <TabsTrigger value="update">Note update</TabsTrigger>
        <TabsTrigger value="misc">Misc</TabsTrigger>
      </TabsList>
      <TabsContent
        value="general"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <General />
      </TabsContent>
      <TabsContent
        value="connect"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <Connect />
      </TabsContent>
      <TabsContent
        value="suggester"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <Suggester />
      </TabsContent>
      <TabsContent
        value="template"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <Template />
      </TabsContent>
      <TabsContent
        value="update"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <Update />
      </TabsContent>
      <TabsContent
        value="misc"
        className="divide-y flex-grow overflow-y-scroll"
      >
        <Misc />
      </TabsContent>
    </Tabs>
  );
}

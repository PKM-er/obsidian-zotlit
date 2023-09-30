import mapGroupBy from "core-js-pure/full/map/group-by";
import objectGroupBy from "core-js-pure/full/object/group-by";

import type { EtaCore } from "eta-prf";
import { around } from "monkey-around";
import { parseYaml, Notice } from "obsidian";
import { extractFrontmatter } from "../get-fm";
import type { AnnotHelper } from "../helper";
import { renderFilename } from "../utils";
import { fromPath } from "./preset";
import type { ObsidianEta } from ".";

export function patchCompile(eta: ObsidianEta) {
  around(eta, {
    compile: (next) =>
      function compile(this: EtaCore, template, options) {
        const self = this as ObsidianEta;
        const compiled = next.call(this, template, options);
        if (!options?.filepath) return compiled;
        const filepath = options.filepath;
        const builtIn = fromPath(filepath, self.settings.templateDir);
        if (!builtIn) return compiled;
        let postProcessed = compiled;
        switch (builtIn.name) {
          case "filename":
            postProcessed = (data, opts) => {
              return renderFilename(compiled.call(this, data, opts));
            };
            break;
          case "annotation":
            postProcessed = (data, opts) => {
              const result = compiled.call(this, data, opts);
              let warpCallout = true;
              const { yaml, body } = extractFrontmatter(result);
              if (yaml) {
                try {
                  if (parseYaml(yaml).callout === false) warpCallout = false;
                } catch (error) {
                  new Notice(`Error parsing frontmatter, ${error}`);
                }
              }
              if (!warpCallout) return body;
              const lines = body.trim().split("\n");
              // console.log(lines[0], calloutPattern.test(lines[0]));
              // no longer add callout when missing in case that
              // label added in annotations template
              // if (!calloutPattern.test(lines[0])) {
              //   lines.unshift(`[!NOTE]`);
              // }
              lines.push(`^${(data as AnnotHelper).blockID}`);
              return lines.map((v) => `> ${v}`).join("\n");
            };
            break;
          default:
            break;
        }

        if (Object.groupBy && Map.groupBy) {
          return postProcessed;
        }
        return (data, opts) => {
          const revert = patchGroupBy();
          const result = postProcessed.call(this, data, opts);
          revert();
          return result;
        };
      },
  });
}

function patchGroupBy() {
  const revert: (() => void)[] = [];
  if (!Object.groupBy) {
    Object.groupBy = objectGroupBy;
    revert.push(() => delete Object.groupBy);
  }
  if (!Map.groupBy) {
    Map.groupBy = mapGroupBy;
    revert.push(() => delete Map.groupBy);
  }
  return () => revert.forEach((v) => v());
}

declare global {
  interface ObjectConstructor {
    groupBy?: ObjectGroupByFunction;
  }
  interface MapConstructor {
    groupBy?: MapGroupByFunction;
  }
}

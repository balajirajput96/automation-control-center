import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VideoPipelineOperationBadges } from "./VideoPipelineOperationBadges";

describe("VideoPipelineOperationBadges", () => {
  it("renders the exact persisted operation values as visible ON and OFF badges", () => {
    const html = renderToStaticMarkup(<VideoPipelineOperationBadges editPlan={{ clipping: true, silenceRemoval: true, captions: false, voiceOver: true, subtitles: true, aspectRatioConversion: true }} />);

    expect(html).toContain("ON</span>Clipping");
    expect(html).toContain("ON</span>Silence removal");
    expect(html).toContain("OFF</span>Captions");
    expect(html).toContain("ON</span>Voice-over");
    expect(html).toContain("ON</span>Subtitles");
    expect(html).toContain("ON</span>9:16 conversion");
  });
});

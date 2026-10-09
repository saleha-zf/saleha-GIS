// All page copy lives here. Edit this file to change the site text.

export const profile = {
  name: "Saleha",
  title: "Geospatial Data & AI Engineer, national-scale Earth observation",
  statement: "I turn raw, messy data from multiple sources into statistics that hold up on the ground.",
  about: [
    "I have worked on national projects across Pakistan, building end-to-end pipelines that ingest free, open data and turn it into premium insights.",
    "I build the models, the pipelines and the visuals. Everything I ship is checked against field data.",
  ],
  contactLine: "Open to roles, research programmes and project work.",
  // Add links here, for example { label: "Email", href: "mailto:you@example.com" }
  links: [] as { label: string; href: string }[],
};

export const method = [
  { step: "Collect", text: "Open satellite archives, UAV flights, weather feeds and published statistics." },
  { step: "Fuse", text: "Align sources that differ in resolution, timing and format." },
  { step: "Ground", text: "Validate against data collected in the field." },
  { step: "Deliver", text: "Maps and statistics from field level up to national level, refreshed automatically." },
];

export type Project = {
  id: string;
  title: string;
  body: string;
  proof?: { value?: string; label: string };
  data: string[];
  map?: { target?: { kind: "district" | "province"; name: string }; label: string; coord: [number, number] };
  shots: { src: string; w: number; h: number; alt: string; caption: string }[];
};

export const projects: Project[] = [
  {
    id: "crop-mapping",
    title: "Crop mapping before harvest",
    body: "Seasonal models that map wheat, rice, cotton, maize, sugarcane and groundnut across Punjab in both Rabi and Kharif, alongside water, barren land and other vegetation. Sown area is available while the crop is still in the field, so import and export decisions do not have to wait for the annual statistics.",
    proof: { value: "87%", label: "accuracy against field-collected ground truth, Rabi and Kharif" },
    data: ["Satellite time series", "Field survey", "Segmentation"],
    map: { target: { kind: "province", name: "Punjab" }, label: "Punjab", coord: [72.4, 30.9] },
    shots: [
      { src: "/work/crop-province.png", w: 940, h: 454, alt: "Province-wide Kharif crop map of Punjab with crop distribution chart", caption: "Kharif 2026, Punjab" },
      { src: "/work/crop-district.png", w: 939, h: 703, alt: "District crop map of Bahawalnagar with crop areas in hectares", caption: "Kharif 2026, Bahawalnagar" },
    ],
  },
  {
    id: "yield",
    title: "Yield at pixel level",
    body: "Annual district statistics downscaled to individual pixels using dasymetric allocation, kriging and IDW interpolation, so wheat yield can be read field by field and compared against the district and province average within the season.",
    proof: { value: "83%", label: "agreement with field-measured yields" },
    data: ["AgriStats", "Dasymetric allocation", "Kriging", "IDW"],
    map: { target: { kind: "district", name: "Faisalabad" }, label: "Faisalabad", coord: [73.1, 31.21] },
    shots: [
      { src: "/work/yield.png", w: 940, h: 454, alt: "Wheat yield map of Faisalabad with district average and historical trend", caption: "Rabi 2026, wheat, Faisalabad" },
    ],
  },
  {
    id: "flood",
    title: "Weekly flood watch",
    body: "Sentinel-1 SAR composites built every week for every district of Pakistan and stored as cloud-optimised GeoTIFFs. Each one separates permanent water, seasonal water and flood, then reports how much of the district and how much of its cropland is under water.",
    proof: { label: "Validated against UNOSAT 2022 flood extents" },
    data: ["Sentinel-1 SAR", "COG", "Weekly composites"],
    map: { label: "All districts, Pakistan", coord: [69.35, 30.38] },
    shots: [
      { src: "/work/flood.png", w: 940, h: 576, alt: "Flood map of Faisalabad with flooded area, cropland flooded and weekly trend", caption: "Week to 16 Sep 2026, Faisalabad" },
    ],
  },
  {
    id: "advisory",
    title: "Field advisories from satellite",
    body: "A retrieval-based agent that reads a field's vegetation indices, works out its growth stage, compares it with the ideal conditions for that stage and writes a weekly advisory grounded in crop production guides.",
    data: ["Vegetation indices", "Weather", "RAG", "Crop production guides"],
    map: { target: { kind: "district", name: "Attock" }, label: "Attock", coord: [72.29, 33.46] },
    shots: [
      { src: "/work/advisory.png", w: 1553, h: 643, alt: "Field boundaries on imagery beside a generated advisory for a maize field at tasselling", caption: "Maize at tasselling, Kharif 2026" },
    ],
  },
  {
    id: "uav",
    title: "Crop growth from drones",
    body: "Multispectral and thermal UAV imagery used to track growth stages and predict yield for wheat, rice and sunflower, combined with weather to produce stage-specific advice.",
    data: ["UAV multispectral", "Thermal", "Weather", "Phenology"],
    shots: [],
  },
];

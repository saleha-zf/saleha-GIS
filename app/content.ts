// All page copy lives here. Edit this file to change the site text.

export const profile = {
  name: "Saleha Zainab Fatima",
  role: "Team Lead, Data & AI at GreenAI, precision agriculture division, Pakistan",
  cv: "/Saleha_Zainab_Fatima_CV.pdf",
  title: "Geospatial Data & AI Engineer, national-scale Earth observation",
  statement: "I turn raw, messy data from multiple sources into statistics that hold up on the ground.",
  about: [
    "I work on national projects across Pakistan, building end-to-end pipelines that ingest raw, multimodal data and turn it into decision-ready maps and statistics.",
  ],
  affiliation:
    "The crop mapping, yield and advisory work was built independently as part of Agriverse, a national precision agriculture programme funded and backed by the Government of Pakistan.",
  contactLine: "Open to roles, research programmes and project work.",
  links: [
    { label: "saleha.zf22@gmail.com", href: "mailto:saleha.zf22@gmail.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/saleha-zainab-fatima/" },
    { label: "GitHub", href: "https://github.com/saleha-zf" },
    { label: "CV", href: "/cv" },
  ] as { label: string; href: string }[],
};

// Kept short on purpose: the work above carries the page.
export const background: { when: string; what: string; where: string; note?: { text: string; href: string } }[] = [
  { when: "2025 to now", what: "Team Lead, Data & AI", where: "GreenAI, National Science and Technology Park, Islamabad" },
  {
    when: "2025",
    what: "Deep Learning Research Intern",
    where: "Machine Vision and Intelligent Systems Lab",
    note: { text: "Published in IEEE Xplore", href: "https://ieeexplore.ieee.org/document/11321433/" },
  },
  { when: "2022 to 2026", what: "BE Software Engineering", where: "National University of Sciences & Technology (NUST), Islamabad" },
];

export const method = [
  { step: "Collect", icon: "satellite", text: "Sentinel-1 radar, Sentinel-2 optical, UAV multispectral and thermal flights, weather feeds and AgriStats tables." },
  { step: "Fuse", icon: "layers", text: "Radar and optical time series, drone imagery and district statistics brought onto one grid, field by field." },
  { step: "Ground", icon: "target", text: "Checked against field surveys and ground measurements before anything ships." },
  { step: "Deliver", icon: "chart", text: "Cloud-optimised GeoTIFFs, provincial, district and field statistics, and dashboards, refreshed every week or season." },
] as const;

export type Project = {
  id: string;
  title: string;
  body: string;
  proof?: { value?: string; label: string };
  /** Small interactive 3D map. `layer` is a raster built from a COG with data/build_layer.py. */
  map?: { target?: { kind: "district" | "province"; name: string }; label: string; coord: [number, number]; layer?: string; from?: "pakistan" | "punjab"; fields?: boolean };
  sequence?: "crop" | "yield" | "flood" | "uav";
  publication?: { title: string; venue: string; href: string };
  shots: { src: string; w: number; h: number; alt: string; caption: string }[];
};

export const projects: Project[] = [
  {
    id: "crop-mapping",
    title: "Crop mapping before harvest",
    body: "Seasonal models built on Sentinel-1 radar and Sentinel-2 optical time series map wheat, rice, cotton, maize, sugarcane and groundnut across Punjab in both Rabi and Kharif, alongside water, bare land and natural vegetation. Sown area is known while the crop is still in the field, so import and export decisions don't have to wait for the annual statistics.",
    proof: { value: "87%", label: "accuracy against field-collected ground truth, Rabi and Kharif" },
    map: { target: { kind: "district", name: "Jhang" }, label: "Jhang, Kharif 2026", coord: [72.34, 31.314], layer: "/layers/jhang-kharif" },
    sequence: "crop",
    shots: [],
  },
  {
    id: "yield",
    title: "Yield at pixel level",
    body: "Wheat yield predicted for every field before harvest, trained on a five-year yield database and built with geospatial techniques such as dasymetric mapping and spatial interpolation.",
    proof: { value: "83%", label: "accuracy on field-measured yields" },
    map: { target: { kind: "district", name: "Sargodha" }, label: "Sargodha, Rabi 2026", coord: [72.719, 32.1], layer: "/layers/sargodha-yield", from: "punjab" },
    sequence: "yield",
    shots: [],
  },
  {
    id: "flood",
    title: "Weekly flood watch",
    body: "Sentinel-1 SAR composites built every week for every district of Pakistan and stored as cloud-optimised GeoTIFFs. Each one separates permanent water, seasonal water and flood, then reports how much of the district and how much of its cropland is under water.",
    proof: { value: "91%", label: "IoU score, validated against UNOSAT 2022 flood extents" },
    map: { target: { kind: "district", name: "Lodhran" }, label: "Lodhran, weekly composite", coord: [71.731, 29.643], layer: "/layers/lodhran-flood", from: "punjab" },
    sequence: "flood",
    shots: [],
  },
  {
    id: "advisory",
    title: "Field advisories from satellite",
    body: "A retrieval-based agent that reads a field's satellite vegetation indices and current weather, works out its growth stage, compares it with the ideal conditions for that stage and writes a weekly advisory grounded in crop production guides.",
    map: { target: { kind: "province", name: "Punjab" }, label: "Punjab, field advisories", coord: [72.7, 31.2], fields: true },
    shots: [
      { src: "/work/advisory.png", w: 1553, h: 643, alt: "Field boundaries on imagery beside a generated advisory for a maize field at tasselling", caption: "Maize at tasselling, Kharif 2026" },
    ],
  },
  {
    id: "uav",
    title: "Crop growth from drones",
    body: "Multispectral and thermal UAV imagery used to track growth stages and predict yield for wheat, rice and sunflower, combined with weather to produce stage-specific advice.",
    publication: {
      title: "Semi-Supervised Contrastive Representation Learning for Sunflower Phenology Estimation",
      venue: "IEEE Xplore, ICET 2025",
      href: "https://ieeexplore.ieee.org/document/11321433/",
    },
    sequence: "uav",
    shots: [],
  },
];

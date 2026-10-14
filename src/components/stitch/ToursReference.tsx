// Layout transcribed from the user-provided Stitch design. Demo fixtures match the reference.
export function ToursReference() {
  return (
    <>
      <div className="flex flex-col w-full">
        <section className="relative w-full bg-surface px-gutter py-space-xl overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div className="max-w-3xl flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    {"Dry Season Alpine Field Schedule"}
                  </span>
                  <span className="text-outline font-label-sm text-label-sm">
                    {"/"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {"Q4 2024 Expeditions"}
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight uppercase font-bold">
                  {"\n            Find Your Next "}
                  <span className="text-secondary">{"Adventure"}</span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  {
                    "\n            Curated trekking expeditions & high-altitude camping experiences led by certified wilderness guides across Vietnam. High-integrity custody, satellite track telemetry, and complete field logistics.\n          "
                  }
                </p>
              </div>
              <div className="bg-surface-container p-space-md rounded-xl flex items-center gap-space-md shadow-sm self-start lg:self-auto">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {"Field Guides Deployed"}
                  </span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {"14 Crews"}
                  </span>
                </div>
                <div className="w-px h-10 bg-outline-variant"></div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {"Summit Weather Status"}
                  </span>
                  <span className="font-label-md text-label-md text-on-tertiary-container flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      {"verified"}
                    </span>
                    {" Ideal Conditions\n            "}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-md flex flex-col gap-space-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {"hiking"}
                    </span>
                    {" Activity Type\n            "}
                  </label>
                  <div className="flex bg-surface-container-high p-1 rounded-lg">
                    <button
                      className="flex-1 py-1.5 px-2 rounded font-label-sm text-label-sm uppercase bg-primary-container text-on-primary font-semibold transition-all"
                      data-action="1"
                      type="button"
                    >
                      {"All"}
                    </button>
                    <button
                      className="flex-1 py-1.5 px-2 rounded font-label-sm text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-all"
                      data-action="2"
                      type="button"
                    >
                      {"Trekking"}
                    </button>
                    <button
                      className="flex-1 py-1.5 px-2 rounded font-label-sm text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-all"
                      data-action="3"
                      type="button"
                    >
                      {"Camping"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {"terrain"}
                    </span>
                    {" Wilderness Region\n            "}
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Wilderness region"
                      className="w-full h-11 bg-surface-container-high px-space-sm rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface cursor-pointer"
                    >
                      <option>{"All Highlands & Ridges"}</option>
                      <option>{"Ta Nang - Phan Dung (Central Plateau)"}</option>
                      <option>{"Bidoup Nui Ba National Park"}</option>
                      <option>{"Lam Dong / Da Lat Alpine Valley"}</option>
                      <option>{"Bach Ma Wilderness Reserve"}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[18px]">
                      {"expand_more"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {"speed"}
                    </span>
                    {" Physical Difficulty\n            "}
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Physical difficulty"
                      className="w-full h-11 bg-surface-container-high px-space-sm rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface cursor-pointer"
                    >
                      <option>{"All Grades (I - IV)"}</option>
                      <option>{"Grade I - Casual & Beginners"}</option>
                      <option>{"Grade II - Moderate Ridge Trek"}</option>
                      <option>{"Grade III - Challenging Multi-Day"}</option>
                      <option>{"Grade IV - Extreme Backcountry"}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[18px]">
                      {"expand_more"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {"calendar_month"}
                    </span>
                    {" Expedition Window\n            "}
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Expedition window"
                      className="w-full h-11 bg-surface-container-high px-space-sm rounded-lg font-body-sm text-body-sm text-on-surface appearance-none focus:outline-none focus:bg-surface cursor-pointer"
                    >
                      <option>{"October 2024 (Dry Onset)"}</option>
                      <option>{"November 2024 (Peak Season)"}</option>
                      <option>{"December 2024 (Winter Solstice)"}</option>
                      <option>{"January 2025 (Highland Frost)"}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-[18px]">
                      {"expand_more"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs border-t border-outline-variant/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {"Fast Tags:"}
                  </span>
                  <button
                    className="bg-surface-container px-2.5 py-1 rounded font-label-sm text-label-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                    data-action="4"
                    type="button"
                  >
                    {"Under 3,000,000 VND"}
                  </button>
                  <button
                    className="bg-surface-container px-2.5 py-1 rounded font-label-sm text-label-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                    data-action="5"
                    type="button"
                  >
                    {"Weekend Sleeper Transit"}
                  </button>
                  <button
                    className="bg-surface-container px-2.5 py-1 rounded font-label-sm text-label-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                    data-action="6"
                    type="button"
                  >
                    {"Gear Rental Available"}
                  </button>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    data-action="7"
                    type="button"
                  >
                    {"Clear"}
                  </button>
                  <button
                    className="bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-md text-label-md uppercase tracking-wider px-space-md py-2.5 rounded shadow-sm flex items-center gap-1.5 transition-all"
                    data-action="8"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {"travel_explore"}
                    </span>
                    {" Filter Expeditions (8)\n            "}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          data-tour="tanang"
          className="w-full bg-surface-container-low px-gutter py-space-xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold">
                    {"Featured Spotlight"}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    {"Permit Route #TN-PD-09"}
                  </span>
                </div>
                <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase font-bold tracking-tight">
                  {
                    "\n            Ta Nang \u2013 Phan Dung 3D2N Expedition\n          "
                  }
                </h2>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  {"Live Dispatch Status:"}
                </span>
                <span className="bg-error/15 text-error px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  <span data-featured-slots="">
                    {" Only 4 Slots Remaining"}
                  </span>
                </span>
              </div>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden bg-primary-container text-surface-bright shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
                <div className="relative lg:col-span-7 min-h-[320px] lg:min-h-full">
                  <img
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnOF0Q7js4eLOqN5X3u_rAIVTDNqUw3exig3E7o9CTkedkfnW1lCmowP2ebibOxN0EPBKL080Ot7PKwOS_YRSC8mp0DsqwOJmhrnq1MqZs08zwOw5EihzdI-dcJuyTyGHQs6z8TaeYS2SmENvjdU-m2DRq8JVnYKrx2zWzRLypcc7XmIdMlZJFN2SPkSCrJd26KMIQOwEsLWWm-LGf02s_Epn1TloI1ilbQzinPJuRFIt80M3lrGKa"
                    alt="Cinematic vast rolling grass ridges and pine forests of Ta Nang Phan Dung highland trail in Vietnam, atmospheric mountain mist at dawn, alpine adventurers with technical backpacks traversing steep sunlit trail, rich earth tones, warm morning light, cinematic outdoor photography, Hasselblad medium format feel."
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent lg:hidden"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary-container hidden lg:block"></div>
                  <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 flex flex-wrap gap-2">
                    <span className="bg-primary-container/90 backdrop-blur-md px-3 py-1.5 rounded text-surface-bright font-label-sm text-label-sm uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        {"explore"}
                      </span>
                      {" 35 km Total Distance\n              "}
                    </span>
                    <span className="bg-primary-container/90 backdrop-blur-md px-3 py-1.5 rounded text-surface-bright font-label-sm text-label-sm uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        {"altitude"}
                      </span>
                      {" +1,100m / -1,700m Vert\n              "}
                    </span>
                    <span className="bg-primary-container/90 backdrop-blur-md px-3 py-1.5 rounded text-surface-bright font-label-sm text-label-sm uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        {"groups"}
                      </span>
                      {" 16 Pax Max Group\n              "}
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-5 p-space-lg lg:p-space-xl flex flex-col justify-between gap-space-md bg-primary-container">
                  <div className="flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="bg-secondary/20 text-secondary-fixed px-3 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                        {
                          "\n                  Trekking Tour \u2022 Moderate / Challenging\n                "
                        }
                      </span>
                      <span className="font-label-sm text-label-sm text-on-primary-container uppercase">
                        {"Grade III Ascent"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-on-primary-container uppercase">
                        {"Fixed Departure"}
                      </span>
                      <p className="font-headline-md text-headline-md text-surface-bright font-bold">
                        {"Oct 18 \u2013 Oct 20, 2024"}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-primary-container">
                        {
                          "3 Days / 2 Nights \u2022 Sleeper coaches depart Saigon Oct 17 @ 21:00"
                        }
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest/10 rounded-xl p-space-md flex flex-col gap-space-xs">
                      <div className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                          {"location_on"}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-surface-bright font-semibold">
                            {"Staging & Rendezvous Point"}
                          </span>
                          <p className="font-body-sm text-body-sm text-on-primary-container">
                            {
                              "TerraPeak Da Lat Outpost (04 Tran Hung Dao) or Direct Saigon Sleeper Transfer."
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-space-xs mt-2 pt-2 border-t border-on-primary-container/20">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                          {"satellite_alt"}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-surface-bright font-semibold">
                            {"Safety Telemetry Standard"}
                          </span>
                          <p className="font-body-sm text-body-sm text-on-primary-container">
                            {
                              "Garmin inReach SOS Link + 1 Licensed Mountain Guide per 4 Explorers."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-outline/20">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase text-on-primary-container">
                        {"All-Inclusive Pass"}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline-lg text-headline-lg text-surface-bright font-bold">
                          {"2,850,000"}
                        </span>
                        <span className="font-label-md text-label-md text-secondary-fixed">
                          {"VND"}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-primary-container">
                        {"per participant"}
                      </span>
                    </div>
                    <button
                      className="w-full sm:w-auto bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-lg text-label-lg uppercase tracking-wider px-space-lg py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
                      data-action="9"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {"assignment_turned_in"}
                      </span>
                      {" Book Adventure\n              "}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-md text-headline-md text-on-surface uppercase font-bold">
                    {"Field Route Itinerary"}
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {"35km High Ridge Transition"}
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm">
                  <div className="bg-surface-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:bg-surface-container-highest">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="bg-primary text-on-primary font-label-md text-label-md uppercase px-2.5 py-1 rounded font-bold">
                          {"Day 01"}
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {"Pine Canopies & The First Grass Knolls"}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {"13.5 KM \u2022 +620M"}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {
                        "\n                Assemble at Da Lat Outpost for gear checks and safety briefing. Transfer via trail vehicle to the Ta Nang forest edge. Hike through dense three-needle pine forests into expansive undulating savannas. Arrive at campsite 01 on the Bald Hills ridge before golden hour. Fire-cooked highland dinner and stargazing.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-3 pt-2 font-label-sm text-label-sm text-outline">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"bed"}
                        </span>
                        {" Ridge Tent Camp"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"restaurant"}
                        </span>
                        {" Lunch, Dinner Included"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:bg-surface-container-highest">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="bg-primary text-on-primary font-label-md text-label-md uppercase px-2.5 py-1 rounded font-bold">
                          {"Day 02"}
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {"Seven Falls Ridge & Milestone Boundary"}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {"14.0 KM \u2022 -890M"}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {
                        "\n                Wake to 360-degree sunrise above the cloud bank. Traverse the famous razorback spine marking the Lam Dong / Binh Thuan provincial border. Technical descents requiring trekking poles. Camp near the pristine stream headwaters of Phan Dung, setting sheltered tents under ancient riparian trees.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-3 pt-2 font-label-sm text-label-sm text-outline">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"bed"}
                        </span>
                        {" Riverbank Campsite"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"restaurant"}
                        </span>
                        {" Breakfast, Lunch, Trail BBQ"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:bg-surface-container-highest">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="bg-primary text-on-primary font-label-md text-label-md uppercase px-2.5 py-1 rounded font-bold">
                          {"Day 03"}
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {"River Crossings to Phan Dung Delta"}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {"7.5 KM \u2022 -340M"}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {
                        "\n                Early morning breakfast followed by 7 seasonal stream fordings through dry deciduous forest. Arrive at the Phan Dung exit outpost by 13:30 for victory refreshments and hot showers. Board the shuttle to Phan Thiet railway / Saigon sleeper bus connection.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-3 pt-2 font-label-sm text-label-sm text-outline">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"check_circle"}
                        </span>
                        {" Route Finished"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"restaurant"}
                        </span>
                        {" Breakfast, Celebration Feast"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-high p-space-md rounded-xl flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        {"show_chart"}
                      </span>
                      {" Elevation Profile & Waypoints\n              "}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {"Peak: 1,480m | Exit: 180m"}
                    </span>
                  </div>
                  <div className="w-full h-24 relative flex items-end">
                    <svg
                      className="w-full h-full text-secondary"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 500 100"
                    >
                      <path
                        d="M0,70 Q50,40 120,25 T220,15 T310,35 T400,75 L500,92 L500,100 L0,100 Z"
                        fill="currentColor"
                        fillOpacity="0.15"
                      ></path>
                      <path
                        d="M0,70 Q50,40 120,25 T220,15 T310,35 T400,75 L500,92"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3"
                      ></path>
                      <circle
                        className="fill-primary"
                        cx="0"
                        cy="70"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-secondary"
                        cx="120"
                        cy="25"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-error"
                        cx="220"
                        cy="15"
                        r="5"
                      ></circle>
                      <circle
                        className="fill-secondary"
                        cx="310"
                        cy="35"
                        r="4"
                      ></circle>
                      <circle
                        className="fill-primary"
                        cx="500"
                        cy="92"
                        r="4"
                      ></circle>
                    </svg>
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px] pt-1">
                    <span>{"Ta Nang (1,100m)"}</span>
                    <span>{"Bald Ridge Camp (1,340m)"}</span>
                    <span>{"Milestone Peak (1,480m)"}</span>
                    <span>{"Stream Valley (480m)"}</span>
                    <span>{"Phan Dung (180m)"}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="bg-surface-container p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                  <h4 className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      {"verified_user"}
                    </span>
                    {" Expedition Inclusions\n            "}
                  </h4>
                  <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                        {"check"}
                      </span>
                      <span>
                        <strong>{"Certified Wilderness Guides:"}</strong>
                        {" WFA-certified lead guide plus 2 assistant sweepers."}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                        {"check"}
                      </span>
                      <span>
                        <strong>{"Porter Logistics:"}</strong>
                        {
                          " Dedicated crew carries all food supplies, communal shelters, and cooking gear."
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                        {"check"}
                      </span>
                      <span>
                        <strong>{"Full Field Catering:"}</strong>
                        {
                          " 5 hearty trail meals cooked fresh, plus trail energy nuts and electrolytes."
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                        {"check"}
                      </span>
                      <span>
                        <strong>{"Satellite Tracking:"}</strong>
                        {
                          " Garmin inReach live broadcast for family at home and outpost dispatch."
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                        {"check"}
                      </span>
                      <span>
                        <strong>{"National Park Permits & Insurance:"}</strong>
                        {
                          " Full forestry access clearance and 100M VND emergency cover."
                        }
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="bg-surface-container-high p-space-lg rounded-xl flex flex-col gap-space-sm">
                  <h4 className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">
                      {"vital_signs"}
                    </span>
                    {" Physical Readiness\n            "}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {
                      "\n              This route demands stamina. You will carry personal daypacks (5-7 kg) across steep grassy ridges with direct sun exposure.\n            "
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-label-sm text-label-sm">
                    <div className="bg-surface-container p-2 rounded">
                      <span className="text-outline uppercase block">
                        {"Cardio Fitness"}
                      </span>
                      <span className="text-on-surface font-bold">
                        {"Jog 5km in <35m"}
                      </span>
                    </div>
                    <div className="bg-surface-container p-2 rounded">
                      <span className="text-outline uppercase block">
                        {"Pack Weight"}
                      </span>
                      <span className="text-on-surface font-bold">
                        {"5 - 8 KG Personal"}
                      </span>
                    </div>
                    <div className="bg-surface-container p-2 rounded">
                      <span className="text-outline uppercase block">
                        {"Footwear"}
                      </span>
                      <span className="text-on-surface font-bold">
                        {"Lugged Trail Shoes"}
                      </span>
                    </div>
                    <div className="bg-surface-container p-2 rounded">
                      <span className="text-outline uppercase block">
                        {"Water Capacity"}
                      </span>
                      <span className="text-on-surface font-bold">
                        {"2.5 Liters / Day"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          data-outfitting=""
          className="w-full bg-surface px-gutter py-space-xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-surface-bright px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold">
                    {"Expedition Outfitting"}
                  </span>
                  <span className="text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                    {"Zero Logistics Friction"}
                  </span>
                </div>
                <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase font-bold tracking-tight">
                  {
                    "\n            Recommended Gear For This Expedition\n          "
                  }
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
                  {
                    "\n            Equip yourself for Ta Nang \u2013 Phan Dung. Rent high-grade technical gear or buy permanently. Outpost staff packs and inspects your kit directly before departure.\n          "
                  }
                </p>
              </div>
              <div className="bg-primary-container text-surface-bright p-space-md rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-primary-fixed/20 max-w-xl">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-secondary-container">
                    <span className="material-symbols-outlined text-[18px]">
                      {"auto_awesome"}
                    </span>
                    <span className="font-label-sm text-label-sm uppercase font-bold">
                      {"Smart Expedition Bundle"}
                    </span>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-surface-bright font-bold">
                    {"1-Click 4-Item Tour Rental"}
                  </p>
                  <span className="font-body-sm text-body-sm text-on-primary-container">
                    {"Pack + Poles + Headlamp + Down Bag for 3 Days"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 w-full sm:w-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-secondary-fixed font-bold">
                      {"850,000"}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-primary-container">
                      {"VND"}
                    </span>
                  </div>
                  <button
                    className="w-full sm:w-auto bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-sm text-label-sm uppercase tracking-wider px-space-md py-2 rounded shadow transition-all"
                    data-action="10"
                    type="button"
                  >
                    {"\n              Reserve Bundle\n            "}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  <div className="relative h-56 w-full bg-surface-container-high overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Pj8CHwLsYPf3SiH-7K2oYKO_mBJZsxPr9QBmEPMoc-Nl5TqIgmF-3vSa6Fj9Wpv6ayeFcuUYnoFMjfGvSh2Pc6hCQLJ2OS2hVIJlFh9i5wQlts5EJEL1nIe3V96VllMrxP2W2CGZlhHQ4IoW6tisb3laoldGmpT1_2O_g_fSyMLncw80vvThWmxWIFLHnPjgsNiZNlhEM20hKc2KSmqO7PolgLksP4xR_0E4SOQuHm5kkw3IrVLH"
                      alt="Technical 65 liter mountaineering backpack in forest green and alpine earth tones, durable Cordura fabric, aluminum frame, ergonomic hip belt, photographed clean studio lighting on neutral background."
                      loading="eager"
                    />
                    <span className="absolute top-3 left-3 bg-primary text-surface-bright px-2 py-0.5 rounded font-label-sm text-label-sm uppercase">
                      {"Essential"}
                    </span>
                    <span className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm font-mono">
                      {"1.82 kg"}
                    </span>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                      {"Load Carrying"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {"TerraTrail 65L Expedition Pack"}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {
                        "\n                Heavy-duty internal frame pack with ergonomic suspension harness and integrated storm rain cover.\n              "
                      }
                    </p>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between font-label-sm text-label-sm pt-2 border-t border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {"3-Day Rental:"}
                    </span>
                    <span className="font-bold text-on-surface">
                      {"540,000 VND "}
                      <span className="font-normal text-[10px] text-outline">
                        {"(180k/day)"}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="11"
                      type="button"
                    >
                      {"\n                Rent: 540K\n              "}
                    </button>
                    <button
                      className="bg-primary text-on-primary hover:bg-surface-tint font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="12"
                      type="button"
                    >
                      {"\n                Buy: 3.45M\n              "}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  <div className="relative h-56 w-full bg-surface-container-high overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDNoke39xRmxXghuXoIUvPua7EdXYT0npRkmFKD9WKxAvCh9eGSPLWbV26oOyx2TA9qbbigR1Mzbbe6iApGWxGtH1rAHJldGqJS0ELl8VU7Nn9cCKIkkgvToRo1xe7XuYsEw7zwl1s8OdtEy0gNgUoo0ufkrHAom35pQhEwS1e5G_YmsFIrgx3RlwaRBrF68BGbOj6pqsLsiHEsmFy1UheHiyQw5G4IPcxCQQMN2qAgVLEuOChaVxr"
                      alt="Pair of ultra-light carbon fiber trekking poles with cork handles and flick-lock mechanism, isolated outdoor gear photography, crisp sharp details, matte charcoal carbon and orange accents."
                      loading="eager"
                    />
                    <span className="absolute top-3 left-3 bg-secondary text-on-secondary px-2 py-0.5 rounded font-label-sm text-label-sm uppercase">
                      {"Joint Saver"}
                    </span>
                    <span className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm font-mono">
                      {"390g Pair"}
                    </span>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                      {"Stability & Balance"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {"AlpineGlide Carbon Trekking Poles"}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {
                        "\n                Three-section folding poles with natural cork grips. Crucial for steep Ta Nang descents.\n              "
                      }
                    </p>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between font-label-sm text-label-sm pt-2 border-t border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {"3-Day Rental:"}
                    </span>
                    <span className="font-bold text-on-surface">
                      {"180,000 VND "}
                      <span className="font-normal text-[10px] text-outline">
                        {"(60k/day)"}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="13"
                      type="button"
                    >
                      {"\n                Rent: 180K\n              "}
                    </button>
                    <button
                      className="bg-primary text-on-primary hover:bg-surface-tint font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="14"
                      type="button"
                    >
                      {"\n                Buy: 1.25M\n              "}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  <div className="relative h-56 w-full bg-surface-container-high overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC58BbJA7HK3jq6zrVTTTSgIu2fLKAzk9wZulD0w5peZ4u7w-C0r3llPByOfUnA98g1t_RN2okSxll0sQLU6xIwIvg8e6ZL3oY80ecxL6OFU3jI_IKggX4AZyrEZoUuAthotVAQ57r2FboNdOl5YDEj-nYvb9aAX1KiDVV-c3NN6puKCyBpc-YjuUGZGaA4GQ3I_tIqjgUj5ki4ABAISl3iftu3KN-XmpRZ5vwZlM6kySTKj9pxrNOl"
                      alt="Compact 900 lumen waterproof outdoor headlamp with elastic reflective headband, rugged aluminum housing, night camp gear product shot, focused beam preview."
                      loading="eager"
                    />
                    <span className="absolute top-3 left-3 bg-on-tertiary-container text-surface-bright px-2 py-0.5 rounded font-label-sm text-label-sm uppercase">
                      {"Night Safety"}
                    </span>
                    <span className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm font-mono">
                      {"IPX8 Water"}
                    </span>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                      {"Illumination"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {"LumenTrail 900LM Headlamp"}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {
                        "\n                Rechargeable dual-beam headlamp with red night-vision LED mode and 28-hour battery reservoir.\n              "
                      }
                    </p>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between font-label-sm text-label-sm pt-2 border-t border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {"3-Day Rental:"}
                    </span>
                    <span className="font-bold text-on-surface">
                      {"135,000 VND "}
                      <span className="font-normal text-[10px] text-outline">
                        {"(45k/day)"}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="15"
                      type="button"
                    >
                      {"\n                Rent: 135K\n              "}
                    </button>
                    <button
                      className="bg-primary text-on-primary hover:bg-surface-tint font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="16"
                      type="button"
                    >
                      {"\n                Buy: 850K\n              "}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  <div className="relative h-56 w-full bg-surface-container-high overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsN0WzB_KWuZMr0fC00Fv5NEOq0FgEtMVKvWikIZTz1sZwdcSbcIqv_RwkreXqnF5tuD9Qaa4TFIhQMJ7s0Qd6P2WE6UlufGGmGClDuj6NR0cdvhi5SsGYN18pZ_n8qc--CINsiqUXRDRhKmcpABs4zNrVDKQqOMmYb6oLVXCTk1OTM9GLFGyVX3T6X4fOqyFDJQzaeejxkd2Qmbz0RXrhLmNSN5WFVoz8_z9AbqO1DIuvm93H8bnX"
                      alt="Ultralight hydrophobic goose down mummy sleeping bag in muted terracotta and pine tones, fully cinched hood, placed on rustic wooden deck overlooking foggy mountains."
                      loading="eager"
                    />
                    <span className="absolute top-3 left-3 bg-secondary text-on-secondary px-2 py-0.5 rounded font-label-sm text-label-sm uppercase">
                      {"-5\u00b0C Rated"}
                    </span>
                    <span className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm font-mono">
                      {"750g Down"}
                    </span>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                      {"Thermal Protection"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {"Summit Down Sleeping Bag"}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {
                        "\n                Hydrophobic 800-fill goose down insulation. Essential for chilly ridge windchills at Bald Camp.\n              "
                      }
                    </p>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between font-label-sm text-label-sm pt-2 border-t border-outline-variant/30">
                    <span className="text-on-surface-variant">
                      {"3-Day Rental:"}
                    </span>
                    <span className="font-bold text-on-surface">
                      {"480,000 VND "}
                      <span className="font-normal text-[10px] text-outline">
                        {"(160k/day)"}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="17"
                      type="button"
                    >
                      {"\n                Rent: 480K\n              "}
                    </button>
                    <button
                      className="bg-primary text-on-primary hover:bg-surface-tint font-label-sm text-label-sm uppercase tracking-wider py-2 rounded transition-colors text-center"
                      data-action="18"
                      type="button"
                    >
                      {"\n                Buy: 3.10M\n              "}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[32px] text-on-tertiary-container">
                  {"sanitizer"}
                </span>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">
                    {"TerraPeak Clean-Custody Guarantee"}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {
                      "Every rented sleeping bag and pack is ozone-sanitized, dry-treated, and inspected by our gear masters."
                    }
                  </p>
                </div>
              </div>
              <a
                className="font-label-sm text-label-sm uppercase text-secondary font-bold hover:underline flex items-center gap-1 shrink-0"
                data-path="rent-gear"
                href="#"
                data-action="19"
              >
                {"\n          Explore Complete Gear Rental Vault "}
                <span className="material-symbols-outlined text-[16px]">
                  {"arrow_forward"}
                </span>
              </a>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low px-gutter py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                  {"Seasonal Calendar"}
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase font-bold tracking-tight">
                  {"\n            More Upcoming Adventures\n          "}
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                {
                  "\n          Weekend micro-escapes and alpine peak challenges scheduled for late Autumn. Fully guided with all field permits handled.\n        "
                }
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div
                data-tour="dalat"
                className="bg-surface rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div className="flex flex-col">
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5SPFvZr4Ce51rx3htD0wvrLQ4Zv2QnU-iOuUI63uKEtSL-mJB1hTXxFbeKlwUJShbD8MNJwIotodb3mbXVv9EsG4tERURquIeLZPYdZldtt6VhLFnMCNLJtEyvDs9_WHCEXKL_PZ9NxKsodc-iwVZ88d5aW-bkG8J2Al5Iexex8rbDJU1HKPw3_VMt8Sz3cke5Imo65CXxandWjAdTz46AX5_LilU3xTWLzEPc0GiGEuSBKVlhAb6"
                      alt="Breathtaking sea of clouds at sunrise over Da Lat pine hills, two canvas bell tents pitched on a wooden platform overlooking the misty valley, warm golden sunlight, tranquil atmosphere, cinematic travel photography."
                      loading="eager"
                    />
                    <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded font-label-sm text-label-sm uppercase font-bold">
                      {"\n                Camping Event\n              "}
                    </div>
                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {" 7 Slots Left\n              "}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur text-surface-bright px-2.5 py-1 rounded font-label-sm text-label-sm">
                      {"\n                2 Days / 1 Night\n              "}
                    </div>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">
                      {"Da Lat Pine Ridge \u2022 Easy"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {
                        "\n                Da Lat Cloud Hunting & Pine Ridge Camping\n              "
                      }
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {
                        "\n                Experience the magic of high-altitude dawn inversions. Includes private forest campsite, campfire drip coffee, acoustic session, and campfire Dutch oven dinner.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-4 pt-2 font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                      <span>{"Departs: Oct 26"}</span>
                      <span>{"\u2022"}</span>
                      <span>{"Min Age: 8+"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex items-center justify-between border-t border-outline-variant/30 mt-space-sm pt-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline uppercase">
                      {"Per Person"}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {"1,450,000 "}
                      <span className="font-label-sm text-label-sm font-normal">
                        {"VND"}
                      </span>
                    </span>
                  </div>
                  <button
                    className="bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-sm text-label-sm uppercase tracking-wider px-space-md py-2.5 rounded transition-colors"
                    data-action="20"
                    type="button"
                  >
                    {"\n              Details & Book\n            "}
                  </button>
                </div>
              </div>
              <div
                data-tour="bidoup"
                className="bg-surface rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div className="flex flex-col">
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTFMnAS8a_6Buxt7AVRWRYiIFT4tjv4YJbP7-A9aesyKkKhE0b5fk9tRL0t7JXmMI6Ok-bZBD03-xg52O-mybfF6uDL8-My8SG71x_n2oHz0APO3D26_lXNYiuuxBFrzkjFaZud0KxSwTAAGHq_us1HkFelJ6le2m0tlyJ8Qfocb4s3eqIUgrikHCV2qBf9c2QNzVeezb1-ehTL88jhjq39OJfFnMhwhC9vOZhvJSZM2wRf7lVNTGR"
                      alt="Dense primeval mossy cloud forest in Bidoup Nui Ba National Park Vietnam, hanging epiphytes and ancient lichen-covered trees, misty mystical high mountain trail, adventurous hiker crossing wooden suspension bridge."
                      loading="eager"
                    />
                    <div className="absolute top-3 left-3 bg-primary text-surface-bright px-2.5 py-1 rounded font-label-sm text-label-sm uppercase font-bold">
                      {"\n                Trekking Tour\n              "}
                    </div>
                    <div className="absolute top-3 right-3 bg-error text-on-error px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-bright animate-ping"></span>
                      {" 2 Slots Left\n              "}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur text-surface-bright px-2.5 py-1 rounded font-label-sm text-label-sm">
                      {"\n                3 Days / 2 Nights\n              "}
                    </div>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                      {"Bidoup National Park \u2022 Challenging"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {
                        "\n                Bidoup Nui Ba Peak 2,287m Challenge\n              "
                      }
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {
                        "\n                The roof of Lam Dong province. Trek through mystical primordial mossy cloud forests, ancient cypress trees, and summit the legendary 2,287m peak.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-4 pt-2 font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                      <span>{"Departs: Nov 01"}</span>
                      <span>{"\u2022"}</span>
                      <span>{"Grade III Trek"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex items-center justify-between border-t border-outline-variant/30 mt-space-sm pt-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline uppercase">
                      {"Per Person"}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {"3,200,000 "}
                      <span className="font-label-sm text-label-sm font-normal">
                        {"VND"}
                      </span>
                    </span>
                  </div>
                  <button
                    className="bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-sm text-label-sm uppercase tracking-wider px-space-md py-2.5 rounded transition-colors"
                    data-action="21"
                    type="button"
                  >
                    {"\n              Details & Book\n            "}
                  </button>
                </div>
              </div>
              <div
                data-tour="chuachan"
                className="bg-surface rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div className="flex flex-col">
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEhzBhS-Gg3L1nq0579NQy67W1OAEXp39cAoYeWfiSqF8ZTGS406wE-XLzq78sdjT9KZ8CIHI1jnPrGHMmg4EBKrsQCsef5iFLP73vvz6Uen2Yob1GdHUG6qxqvOO4Azg3V5ippPBiZJuyaum4Z804rW22IaPnVzY99vt0KLlelaZh_OqS-lZLMrDfWoTJaNVXC-d-OHsqF7rGC9OpDueHeWT_DMM13jZZ0ENObwmz3KD3XBTcKcT6"
                      alt="Spectacular panoramic view from the rocky summit of Mount Chua Chan at dawn, hikers gathered around an early morning camp watching the sunrise over vast plains and lakes, dramatic warm orange sky."
                      loading="eager"
                    />
                    <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded font-label-sm text-label-sm uppercase font-bold">
                      {"\n                Camping Event\n              "}
                    </div>
                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
                      {" 11 Slots Left\n              "}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-primary/80 backdrop-blur text-surface-bright px-2.5 py-1 rounded font-label-sm text-label-sm">
                      {"\n                2 Days / 1 Night\n              "}
                    </div>
                  </div>
                  <div className="p-space-md flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">
                      {"Dong Nai Province \u2022 Moderate"}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                      {
                        "\n                Chua Chan Mountain Sunrise Camp\n              "
                      }
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {
                        "\n                The Second Highest Peak of the South (837m). Power line ascent, ridge tent bivouac, and unmatched panoramic sunrise over Tri An lake horizon.\n              "
                      }
                    </p>
                    <div className="flex items-center gap-4 pt-2 font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                      <span>{"Departs: Nov 09"}</span>
                      <span>{"\u2022"}</span>
                      <span>{"Saigon Transfer"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md pt-0 flex items-center justify-between border-t border-outline-variant/30 mt-space-sm pt-space-sm">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline uppercase">
                      {"Per Person"}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {"1,150,000 "}
                      <span className="font-label-sm text-label-sm font-normal">
                        {"VND"}
                      </span>
                    </span>
                  </div>
                  <button
                    className="bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-sm text-label-sm uppercase tracking-wider px-space-md py-2.5 rounded transition-colors"
                    data-action="22"
                    type="button"
                  >
                    {"\n              Details & Book\n            "}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container p-space-lg rounded-2xl flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">
                    {"altitude"}
                  </span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold uppercase">
                    {"Planning a Private Team or Corporate Ascent?"}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {
                      "We customize custom route pacing, specialized camp outfitting, and full emergency medical support for groups of 8 to 40."
                    }
                  </p>
                </div>
              </div>
              <button
                className="shrink-0 bg-surface-container-highest hover:bg-outline-variant/40 text-on-surface font-label-md text-label-md uppercase tracking-wider px-space-lg py-3 rounded-lg transition-colors"
                data-action="23"
                type="button"
              >
                {"\n          Request Bespoke Expedition\n        "}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

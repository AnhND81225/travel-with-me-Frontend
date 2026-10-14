// Layout transcribed from the user-provided Stitch design. Demo fixtures match the reference.
export function OrdersReference() {
  return (
    <>
      <div className="flex flex-col w-full">
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
          <div className="absolute top-20 right-0 w-[450px] h-[450px] rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl relative z-10">
            <section className="flex flex-col gap-space-lg">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                      {
                        "\n                Field Status: Live Operational\n              "
                      }
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase">
                      {"ID: #TP-VN-9942"}
                    </span>
                  </div>
                  <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                    {"\n              Welcome back, "}
                    <span className="text-secondary">{"Linh Nguyen"}</span>
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">
                      {"verified"}
                    </span>
                    {
                      "\n              Highland Expedition Member \u2022 Tier II Explorer\n              "
                    }
                    <span className="text-outline-variant">{"\u2022"}</span>
                    <span>
                      {"Custody Rating: "}
                      <strong className="text-on-surface font-semibold">
                        {"99.4% Flawless Return"}
                      </strong>
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    className="flex items-center gap-2 px-space-md h-12 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md uppercase tracking-wider shadow-sm transition-all duration-200"
                    data-action="1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {"qr_code_scanner"}
                    </span>
                    <span>{"Quick Check-In"}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-space-md h-12 rounded bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-md text-label-md uppercase tracking-wider shadow-sm transition-all duration-200"
                    data-action="2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {"backpack"}
                    </span>
                    <span>{"Gear Locker"}</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      {"Lifetime Expeditions"}
                    </span>
                    <span className="p-2 rounded bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">
                        {"inventory_2"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-xl text-headline-xl text-on-surface font-bold">
                      {"6"}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        {"check_circle"}
                      </span>
                      {
                        "\n                All contracts safely closed\n              "
                      }
                    </p>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      {"Active Custody"}
                    </span>
                    <span className="p-2 rounded bg-secondary/10 text-secondary">
                      <span className="material-symbols-outlined text-[20px]">
                        {"camping"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-xl text-headline-xl text-secondary font-bold">
                      {"1 Unit"}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {
                        "\n                Ultralight Tent \u2022 Due in 2 Days\n              "
                      }
                    </p>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full"
                      style={{ width: "66%" }}
                    ></div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      {"Upcoming Adventures"}
                    </span>
                    <span className="p-2 rounded bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">
                        {"explore"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-xl text-headline-xl text-on-surface font-bold">
                      {"1 Tour"}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">
                      {
                        "\n                Ta Nang - Phan Dung Ridge\n              "
                      }
                    </p>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-on-tertiary-container h-full rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      {"Outpost Field Credit"}
                    </span>
                    <span className="p-2 rounded bg-primary-fixed/30 text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        {"savings"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-xl text-headline-xl text-on-surface font-bold">
                      {"1,200,000 "}
                      <span className="font-label-md text-label-md font-normal">
                        {"VND"}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {"redeem"}
                      </span>
                      {
                        "\n                Applicable to tours or rentals\n              "
                      }
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary font-semibold uppercase">
                    <span>{"Auto-applies on checkout"}</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {"arrow_forward"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                    {"Hardware Custody Lifecycle"}
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    {"Active Rentals In Field"}
                  </h2>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
                  <span>{"Live telemetry synced with Da Lat Alpine Hub"}</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
                <div className="bg-primary-container text-surface-bright px-space-lg py-space-sm flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="p-1 rounded bg-secondary text-on-secondary">
                      <span className="material-symbols-outlined text-[18px]">
                        {"verified_user"}
                      </span>
                    </span>
                    <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">
                      {
                        "Current Rental In Custody \u2014 Da Lat Mountain Outpost"
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-surface-container-high">
                    <span>{"Sanitization & Spec Inspection Verified"}</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-container font-mono text-tertiary-fixed font-bold">
                      {"#VN-8820-ALT"}
                    </span>
                  </div>
                </div>
                <div className="p-space-lg flex flex-col lg:flex-row gap-space-lg items-stretch">
                  <div className="relative w-full lg:w-96 h-64 lg:h-auto rounded-lg overflow-hidden bg-surface-container-high shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX9Dlu1WDH-wY_sYBNTsl6DWhKjaYeW0DDfqxnxvikDR_UXtHhco8Xto3xLvhAdRfj4BjHTEwG5e_y2yY2rDK6XKrHcatWrc_21SSYbFOV3W4JR30sm9A1P3rHxRFqubjqh2mctg95BXGxSJcbz2CKzykrp33iue6DXChU9z9ImGVtbVPoKL5-cd2qP9UppsDVWs5QNXPuySU28DRCkR5Q1gr0ct2uGw4oogL3DffL5p-4Wt70O8Cg"
                      alt="Ultralight high-altitude 2-person expedition tent pitched on misty highland ridge in Da Lat Vietnam, deep forest pine trees in soft mountain morning glow, warm orange guy lines and technical ripstop nylon texture, crisp cinematic lighting, 4k ultra-detailed"
                      loading="eager"
                    />
                    <div className="absolute top-space-sm left-space-sm">
                      <span className="px-2.5 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider shadow">
                        {"\n                  Custody Item\n                "}
                      </span>
                    </div>
                    <div className="absolute bottom-space-sm left-space-sm right-space-sm bg-surface/90 backdrop-blur-md p-space-xs rounded flex items-center justify-between text-on-surface">
                      <span className="font-label-sm text-label-sm font-semibold uppercase">
                        {"Cleanliness Index"}
                      </span>
                      <span className="font-label-sm text-label-sm font-bold text-on-tertiary-container flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {"arrow_back_ios_new"}
                        </span>
                        {" 10/10 Grade A\n                "}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between gap-space-md">
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          {"Apex 3-Season 2-Person Ultralight Tent"}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          {
                            "\n                    Picked Up / In The Field\n                  "
                          }
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {
                          "\n                  Silnylon 15D rainfly, DAC Featherlite poles, taped waterproof seams. Certified for up to 60km/h ridge gusts.\n                "
                        }
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between font-label-sm text-label-sm uppercase tracking-wider">
                        <span className="text-on-surface font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            {"flight_takeoff"}
                          </span>
                          {
                            "\n                    Oct 18, 2024 (08:30 AM)\n                  "
                          }
                        </span>
                        <span className="text-secondary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            {"schedule"}
                          </span>
                          <span data-return-countdown="">
                            {
                              "\n                    Returns in 48 Hours\n                  "
                            }
                          </span>
                        </span>
                        <span className="text-on-surface-variant font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            {"flight_land"}
                          </span>
                          <span data-return-date="">
                            {
                              "\n                    Oct 21, 2024 (17:00 PM)\n                  "
                            }
                          </span>
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-secondary rounded-full transition-all duration-500"
                          style={{ width: "58%" }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                        <div className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5">
                            {"store"}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                              {"Dispatched Station"}
                            </span>
                            <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                              {"Da Lat Alpine Outpost (Hub 02)"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                            {"sync_alt"}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                              {"Permitted Drop-Off Points"}
                            </span>
                            <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                              {"Da Lat Hub OR Ho Chi Minh Flagship"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                      <button
                        className="flex items-center gap-2 px-space-md h-10 rounded bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm"
                        id="openExtendModal"
                        data-action="3"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {"calendar_add_on"}
                        </span>
                        {
                          "\n                  Extend Rental Dates\n                "
                        }
                      </button>
                      <button
                        className="flex items-center gap-2 px-space-md h-10 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors"
                        id="openIssueModal"
                        data-action="4"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {"shield_with_heart"}
                        </span>
                        {
                          "\n                  Report Issue / Damage Waiver\n                "
                        }
                      </button>
                      <button
                        className="flex items-center gap-2 px-space-md h-10 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors"
                        id="showReturnQR"
                        data-action="5"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {"qr_code_2"}
                        </span>
                        {
                          "\n                  Request Return QR Code\n                "
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                    {"Highland Field Itinerary"}
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    {"Upcoming Adventures & Tours"}
                  </h2>
                </div>
                <a
                  className="hidden sm:flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-secondary hover:underline"
                  href="#"
                  data-action="6"
                >
                  <span>{"Explore Backcountry Permits"}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    {"arrow_forward"}
                  </span>
                </a>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
                <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col justify-between">
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXUnV8woiQ3OhEtRkpQalKNabB-QhugXq8_s3XMojyz8dcV8irWrABpYOB7USOB5jhZVgGQ4DujcQ65PNnguD3WHpQx43Vdcx_kQOn6vCggiBF4i44f1L9gjUCkgwFMm1AN5OFfr6aEaPd_VaeTplsvScxbIzAgEfIo2D5l-E9LQ7my0_T1XevQFL0LCGAYLYaCI5Wi18Ve8Vafh__D6vMUv-tRFI5VssedPgZ-x8MvWz_oWLbGBh"
                      alt="Breathtaking rolling grassy green ridges of Ta Nang Phan Dung backcountry trail under glowing golden hour sky, two adventurous hikers with heavy backpacks walking high ridge pathway, dramatic alpine scale, fine mist over valleys"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute top-space-md left-space-md flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold tracking-wider shadow">
                        {
                          "\n                  Confirmed \u2022 Departure in 12 Days\n                "
                        }
                      </span>
                      <span className="px-2.5 py-1 rounded bg-surface/90 text-on-surface backdrop-blur font-label-sm text-label-sm uppercase tracking-wider">
                        {
                          "\n                  Permit #TND-884\n                "
                        }
                      </span>
                    </div>
                    <div className="absolute bottom-space-md left-space-md right-space-md text-surface-bright flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-secondary-fixed font-semibold uppercase tracking-wider">
                        {"Highland Trekking Route"}
                      </span>
                      <h3 className="font-headline-xl text-headline-xl text-surface-bright font-bold">
                        {"Ta Nang \u2013 Phan Dung 3D2N Trekking"}
                      </h3>
                    </div>
                  </div>
                  <div className="p-space-lg flex flex-col gap-space-md">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md bg-surface-container-low p-space-md rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                          {"Rendezvous & Station"}
                        </span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface mt-1">
                          {"TerraPeak Da Lat Outpost"}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {"05:45 AM Sharp \u2022 Oct 30"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                          {"Scout Roster"}
                        </span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface mt-1">
                          {"2 Spots Reserved"}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {"Linh Nguyen + Min Trang"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                          {"Certified Lead Scout"}
                        </span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface mt-1">
                          {'Bao "Eagle" Tran'}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {"WFR & Mountaineer Grade"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                      <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          {"backpack"}
                        </span>
                        <span>
                          {
                            "Mandatory safety briefing on Oct 29 via Outpost portal."
                          }
                        </span>
                      </div>
                      <button
                        className="flex items-center gap-2 px-space-md h-12 rounded bg-primary-container text-surface-bright hover:bg-primary font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm"
                        data-action="7"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {"menu_book"}
                        </span>
                        <span>
                          {"View Expedition Guidebook & Pack Checklist"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-space-lg flex flex-col justify-between gap-space-md shadow-sm">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                        {"Telemetry Preview"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {"LIVE FEED"}
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {"Ridge Conditions: Phan Dung Trail"}
                    </h4>
                    <div className="bg-surface-container-lowest p-space-md rounded-lg flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-[36px] text-secondary">
                          {"wb_sunny"}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-headline-md text-headline-md font-bold text-on-surface">
                            {"21\u00b0C"}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {"Clear skies \u2022 Low mist"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                          {"Day Range"}
                        </span>
                        <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                          {"16\u00b0C \u2013 24\u00b0C"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2 font-body-sm text-body-sm text-on-surface">
                      <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {"air"}
                          </span>
                          {" Ridge Winds\n                  "}
                        </span>
                        <span className="font-semibold">
                          {"Mild (12-18 km/h)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {"water_drop"}
                          </span>
                          {" Precipitation Risk\n                  "}
                        </span>
                        <span className="font-semibold text-on-tertiary-container">
                          {"10% Low"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-surface-container-highest">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {"terrain"}
                          </span>
                          {" Trail Texture\n                  "}
                        </span>
                        <span className="font-semibold">
                          {"Dry red dirt / Firm"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {"emergency_share"}
                          </span>
                          {" Water Points\n                  "}
                        </span>
                        <span className="font-semibold">
                          {"3 Active Natural Springs"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary-container p-space-sm rounded-lg text-surface-container-high flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-container flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[16px]">
                        {"cell_tower"}
                      </span>
                      {" In-Reach Satellite Sync\n              "}
                    </span>
                    <p className="font-body-sm text-body-sm text-on-primary-container">
                      {
                        "\n                Your group will carry an active Garmin InReach paired to our Da Lat station frequency.\n              "
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-space-md pb-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                    {"Ledger & Invoices"}
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    {"Order History & Acquisitions"}
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    className="px-3 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm uppercase font-semibold text-on-surface shadow-sm"
                    data-action="8"
                    type="button"
                  >
                    {"All (6)"}
                  </button>
                  <button
                    className="px-3 py-1 rounded hover:bg-surface-container-high font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant transition-colors"
                    data-action="9"
                    type="button"
                  >
                    {"Rentals"}
                  </button>
                  <button
                    className="px-3 py-1 rounded hover:bg-surface-container-high font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant transition-colors"
                    data-action="10"
                    type="button"
                  >
                    {"Gear Purchases"}
                  </button>
                  <button
                    className="px-3 py-1 rounded hover:bg-surface-container-high font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant transition-colors"
                    data-action="11"
                    type="button"
                  >
                    {"Adventures"}
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-md px-space-md font-semibold">
                          {"Order ID"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold">
                          {"Date"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold">
                          {"Branch Hub"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold">
                          {"Items Breakdown"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold">
                          {"Total Paid"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold">
                          {"Order Status"}
                        </th>
                        <th className="py-space-md px-space-md font-semibold text-right">
                          {"Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <span className="font-mono font-bold text-on-surface">
                            {"#TPO-9042"}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap text-on-surface-variant">
                          {
                            "\n                    Oct 14, 2024\n                  "
                          }
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {"location_on"}
                            </span>
                            {
                              "\n                      Da Lat Hub\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-surface-container-high font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        1x Tent (Rental)\n                      "
                              }
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        1x Pack (Buy)\n                      "
                              }
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        2x Trekking Tour\n                      "
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {"8,654,500 "}
                            <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                              {"VND"}
                            </span>
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            {
                              "\n                      Active / In Progress\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right whitespace-nowrap">
                          <button
                            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold transition-colors"
                            data-action="12"
                            type="button"
                          >
                            {
                              "\n                      View Order Details\n                    "
                            }
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/60 transition-colors bg-surface-container-low/30">
                        <td className="py-space-md px-space-md">
                          <span className="font-mono font-bold text-on-surface">
                            {"#TPO-8812"}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap text-on-surface-variant">
                          {
                            "\n                    Sep 02, 2024\n                  "
                          }
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                              {"location_on"}
                            </span>
                            {
                              "\n                      Ho Chi Minh\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-surface-container-high font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        2x Down Sleeping Bag (Rental)\n                      "
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {"480,000 "}
                            <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                              {"VND"}
                            </span>
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">
                              {"verified"}
                            </span>
                            {
                              "\n                      Completed & Inspected\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right whitespace-nowrap">
                          <button
                            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold transition-colors"
                            data-action="13"
                            type="button"
                          >
                            {
                              "\n                      View Receipt\n                    "
                            }
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <span className="font-mono font-bold text-on-surface">
                            {"#TPO-8420"}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap text-on-surface-variant">
                          {
                            "\n                    Aug 15, 2024\n                  "
                          }
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                              {"location_on"}
                            </span>
                            {
                              "\n                      Da Nang Coastal\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        1x Pocket Stove (Buy)\n                      "
                              }
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                              {
                                "\n                        1x Storm Headlamp (Buy)\n                      "
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {"2,300,000 "}
                            <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                              {"VND"}
                            </span>
                          </span>
                        </td>
                        <td className="py-space-md px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase font-semibold">
                            {
                              "\n                      Fulfilled\n                    "
                            }
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right whitespace-nowrap">
                          <button
                            className="px-3 py-1.5 rounded bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold transition-colors"
                            data-action="14"
                            type="button"
                          >
                            {
                              "\n                      Reorder Gear\n                    "
                            }
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-surface-container px-space-md py-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
                  <span>{"Displaying 3 of 6 recorded expeditions"}</span>
                  <div className="flex items-center gap-space-sm">
                    <button
                      className="hover:text-on-surface flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider font-semibold"
                      data-action="15"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {"file_download"}
                      </span>
                      {" Print Custody Vault\n              "}
                    </button>
                    <span className="text-outline-variant">{"|"}</span>
                    <a
                      className="text-secondary font-label-sm text-label-sm uppercase tracking-wider font-bold hover:underline"
                      href="#"
                      data-action="16"
                    >
                      {
                        "\n                View Older Records (2023)\n              "
                      }
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

import Image from "next/image";
import planeImage from "../../../public/images/plane.png";
import heroBackground from "../../../public/images/hero-sky.png";
import FlightSearchForm from "../flights/flight-search-form";

export default function Hero() {
  return (
    <section className="relative isolate flow-root min-h-[980px] overflow-clip [--plane-frame-size:clamp(230px,32vw,480px)] sm:min-h-[900px] md:min-h-[780px]">
      <div className="absolute inset-0 -z-2 overflow-hidden" aria-hidden="true">
        <Image
          src={heroBackground}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-1 bg-[radial-gradient(ellipse_at_78%_18%,#ffe3b066,transparent_55%),linear-gradient(90deg,#fffbf57a,#fffbf51f_55%,transparent_80%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-[clamp(260px,30vw,400px)] bg-[linear-gradient(to_bottom,#faf9f600_0%,#faf9f60a_12%,#faf9f62b_28%,#faf9f661_44%,#faf9f6a6_60%,#faf9f6db_76%,#faf9f6f5_90%,#faf9f6_100%)]" aria-hidden="true" />

      <div data-motion="light" className="pointer-events-none absolute inset-0 z-2 bg-[radial-gradient(ellipse_at_70%_25%,#fff4dba6,transparent_65%)] opacity-0" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-0 z-1 size-full" viewBox="0 0 1440 780" preserveAspectRatio="none" aria-hidden="true">
        <path data-motion="journey" className="fill-none stroke-[#fff8e9] stroke-[1.5] [stroke-dasharray:1] [stroke-dashoffset:0]" d="M -120 590 C 180 800, 930 720, 1190 -150" pathLength="1" />
      </svg>

      <div data-motion="flight" className="pointer-events-none absolute top-[calc(105px+var(--plane-frame-size)/2)] left-[calc(90%-var(--plane-frame-size)/2)] z-5 w-[calc(var(--plane-frame-size)*1.12)] origin-center opacity-0 [transform:translate3d(-50%,-50%,0)] will-change-[transform,translate,opacity] motion-reduce:hidden" aria-hidden="true">
        <div data-motion="pitch" className="relative -rotate-6">
          <span className="pointer-events-none absolute inset-x-[4%] top-[12%] bottom-0 rounded-full bg-[radial-gradient(ellipse,#fff1cf70,#f8dbab20_45%,transparent_70%)]" />
          <span data-motion="trail-inner" className="pointer-events-none absolute top-[53%] right-[48%] h-[1.4%] min-h-0.5 w-[120%] origin-right -rotate-24 rounded-full bg-[linear-gradient(to_left,transparent_0_5%,#ffffffd9_14%,#ffffff66_55%,transparent)] opacity-0 blur-[1px] [scale:0_1]" />
          <span data-motion="trail-outer" className="pointer-events-none absolute top-[64%] right-[26%] h-[1.4%] min-h-0.5 w-[120%] origin-right -rotate-24 rounded-full bg-[linear-gradient(to_left,transparent_0_5%,#ffffffd9_14%,#ffffff66_55%,transparent)] opacity-0 blur-[1px] [scale:0_1]" />
          <Image
            data-motion="plane"
            src={planeImage}
            alt=""
            sizes="(max-width: 718px) 258px, (max-width: 1500px) 36vw, 538px"
            priority
            className="relative block h-auto w-full [filter:saturate(0.65)_sepia(0.16)_contrast(0.96)_brightness(1.04)]"
          />
          <span data-motion="glint" className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,#fff4dccc_50%,transparent_60%)] bg-size-[300%_100%] bg-position-[100%_0] bg-no-repeat opacity-0 mix-blend-screen [mask:url('/images/plane.png')_center/100%_100%_no-repeat]" />
        </div>
      </div>
      <div data-motion="mist" className="pointer-events-none absolute -inset-x-1/2 top-1/4 -bottom-[20%] z-2 bg-[radial-gradient(ellipse_at_70%_65%,#ffffffa6,transparent_35%),radial-gradient(ellipse_at_30%_85%,#fff7e680,transparent_40%)] opacity-0 motion-reduce:hidden" aria-hidden="true" />

      <div className="relative z-3 mx-auto mt-[165px] w-[88%] max-w-[1400px] text-center sm:mt-40 md:mt-[185px]">
        <p data-motion="eyebrow" className="text-[11px] font-semibold text-[#2b3a4f] uppercase">Simple flight booking</p>
        <h1 data-motion="heading" className="mt-5.5 mb-5 font-serif text-[38px] leading-[1.04] sm:text-[56px] md:text-[72px] xl:text-[92px]">Find your next flight.</h1>
        <p data-motion="subtitle" className="text-[15px] leading-[1.6] text-[#2b3a4f] sm:text-lg">
          Choose your route and dates. Search flights and book in one place.
        </p>
      </div>

      <FlightSearchForm />
    </section>
  );
}

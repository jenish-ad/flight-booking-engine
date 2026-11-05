export default function About() {
  return (
    <section
      id="about"
      className="mx-[6%] mb-17.5 grid items-center gap-4.5 rounded-2xl bg-[#e8eee7] bg-[linear-gradient(110deg,#e8eee7_10%,#e8eee780_60%,transparent),repeating-linear-gradient(135deg,transparent_0_46px,#405f4f30_46px_47px,transparent_47px_53px,#405f4f1c_53px_54px,transparent_54px_100px)] p-7 sm:grid-cols-2 sm:gap-12.5 sm:p-12.5"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase">Why Voyage</p>
        <h2 className="mt-4.5 font-serif text-[38px] leading-[1.08] sm:text-5xl">
          Flight booking.
          <br />
          <em className="text-sage">Made simple.</em>
        </h2>
      </div>
      <div>
        <p className="mb-6 max-w-110 leading-[1.8] text-[#526259]">
          Enter your departure airport, destination and travel dates. Find a flight that fits your schedule and continue to booking.
        </p>
        <a className="text-link" href="#search">
          Search flights <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </section>
  );
}

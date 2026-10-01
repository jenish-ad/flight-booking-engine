import DateFields from "./date-fields";

const airportInput = {
  className: "search-input",
  placeholder: "Airport code (e.g. KTM)",
  pattern: "[A-Za-z]{3}",
  maxLength: 3,
  title: "Enter a three-letter airport code",
  required: true,
};

export default function FlightSearchForm() {
  return (
    <form
      id="search"
      data-motion="search"
      action="/flights"
      className="absolute inset-x-[5%] bottom-5 z-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_40px_-26px_#243b4973] sm:inset-x-[6%] sm:bottom-10.5 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.9fr_auto] max-md:[&>label:nth-child(even)]:border-l max-md:[&>label:nth-child(n+3)]:border-t md:[&>label+label]:border-l"
    >
      <label className="search-field">
        From
        <input name="from" {...airportInput} />
      </label>
      <label className="search-field">
        To
        <input name="to" {...airportInput} />
      </label>

      <DateFields />

      <label className="search-field search-select-field">
        Travelers
        <select className="search-input search-select" name="travelers" defaultValue="1">
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "traveler" : "travelers"}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="group col-span-full flex cursor-pointer items-center justify-center gap-2.5 border-t border-dashed border-line-dashed bg-forest p-4 text-sm font-semibold whitespace-nowrap text-cream transition-colors duration-250 hover:bg-forest-dark focus-visible:outline-2 focus-visible:-outline-offset-6 focus-visible:outline-cream md:col-span-1 md:border-t-0 md:border-l md:px-7.5 md:py-0 motion-reduce:transition-none"
      >
        Search flights
        <span className="transition-transform duration-250 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">
          &rarr;
        </span>
      </button>
    </form>
  );
}

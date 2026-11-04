import Logo from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid flex-1 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative hidden overflow-hidden bg-forest-dark p-12 text-cream md:grid md:content-between">
        <Logo tone="light" />
        <div className="max-w-sm rotate-[-4deg] rounded-2xl bg-paper text-ink shadow-[0_30px_60px_-30px_#000a]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 px-6 pt-6 pb-5">
            <div>
              <p className="text-xs text-slate">From</p>
              <p className="font-serif text-4xl">KTM</p>
            </div>
            <span className="pb-2 text-clay" aria-hidden="true">✈︎</span>
            <div className="text-right">
              <p className="text-xs text-slate">To</p>
              <p className="font-serif text-4xl">DEL</p>
            </div>
          </div>
          <div className="ticket-perforation h-3" aria-hidden="true" />
          <div className="grid grid-cols-3 gap-3 px-6 pt-4 pb-6 text-xs">
            <p>
              <span className="block text-slate">Seat</span>
              <span className="font-semibold">14A</span>
            </p>
            <p>
              <span className="block text-slate">Cabin</span>
              <span className="font-semibold">Economy</span>
            </p>
            <p>
              <span className="block text-slate">Passenger</span>
              <span className="font-semibold">You</span>
            </p>
          </div>
        </div>
        <p className="max-w-xs font-serif text-2xl leading-snug text-cream/90">
          Your bookings, seats and cancellations in one place.
        </p>
      </section>
      <section className="grid place-items-center px-[6%] py-14">
        <div className="grid w-full max-w-sm gap-8">
          <div className="md:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import { FiCheck } from "react-icons/fi";

const features = [
  "Resident Parking",
  "Visitor Parking",
  "Vehicle Registration",
  "Parking Allocation",
  "Parking History",
  "Vehicle Records",
];

const details = [
  { label: "Resident", value: "A-1204" },
  { label: "Vehicle", value: "MH 12 AB 4521" },
  { label: "Type", value: "4 Wheeler" },
];

const Parking = () => {
  return (
    <section className="w-full bg-[#F9F6F2] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-24">
        {/* Left content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Parking &amp; Vehicles
          </p>

          <h2 className="mt-4 max-w-[480px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl">
            Turn Parking Into a Managed System.
          </h2>

          <p className="mt-5 max-w-[440px] text-xs leading-6 text-slate-500 sm:text-sm">
            Digitize visitor, delivery, staff and vehicle entry while keeping
            residents informed in real time.
          </p>

          {/* Features */}
          <ul className="mt-8 grid max-w-[460px] grid-cols-1 gap-x-8 min-[420px]:grid-cols-2">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 border-b border-slate-300 py-3 text-[11px] font-medium text-[#081121] sm:text-xs"
              >
                <FiCheck
                  className="shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right image + card */}
        <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mx-0 lg:ml-auto lg:max-w-[460px]">
          <div className="relative aspect-[460/480] w-full overflow-hidden rounded-tl-[20px] rounded-tr-[80px] rounded-br-[20px] rounded-bl-[80px] shadow-2xl shadow-black/20 sm:rounded-tr-[120px] sm:rounded-bl-[120px]">
            <Image
              src="/img4.jpg"
              alt="Managed society parking area"
              fill
              sizes="(min-width: 1024px) 460px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Slot card */}
          <article className="absolute bottom-3 right-0 w-[180px] rounded-xl bg-white p-3 shadow-xl shadow-black/20 sm:bottom-5 sm:right-0 sm:w-[210px] sm:p-3.5 lg:bottom-6 lg:right-0 lg:w-[220px]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[8px]">
                  Parking Slot
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-[#081121] sm:text-xl">
                  P-204
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[7px] font-bold uppercase tracking-wider text-emerald-600 sm:text-[8px]">
                <FiCheck aria-hidden="true" />
                Assigned
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2">
              {details.map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[6px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[7px]">
                    {label}
                  </dt>
                  <dd className="mt-0.5 truncate text-[8px] font-semibold text-[#081121] sm:text-[9px]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Parking;

import type { Metadata } from "next";
import { FittingForm } from "@/components/content/FittingForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { CornerOrnament } from "@/components/ornaments/CornerOrnament";

export const metadata: Metadata = {
  title: "Contact & Book a Fitting",
  description:
    "Book a private fitting at the SARPECH ateliers in Jaipur, Jodhpur and New Delhi, or by video call. Contact our client care team by phone, email or WhatsApp.",
};

const ATELIERS = [
  {
    city: "Jaipur",
    address: ["The Haveli Atelier, 14 Chaura Rasta", "Near Tripolia Bazaar, Jaipur 302003"],
    hours: "Tue–Sun · 11am – 8pm",
  },
  {
    city: "Jodhpur",
    address: ["Sardar Market Courtyard, 3 Nai Sarak", "Jodhpur 342001"],
    hours: "Tue–Sun · 11am – 7pm",
  },
  {
    city: "New Delhi",
    address: ["Lodhi Colony Studio, 22 Meherchand Market", "New Delhi 110003"],
    hours: "Mon–Sat · 11am – 8pm",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Client Care"
        title="Book a Fitting"
        intro={
          <p>
            Meet our master tailors for a private appointment — measurements, fabric selection and a first look at
            made-to-measure. Fittings are complimentary.
          </p>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <section aria-labelledby="form-title">
          <h2 id="form-title" className="sr-only">
            Appointment request
          </h2>
          <FittingForm />
        </section>

        <aside aria-label="Ateliers and contact" className="space-y-10">
          <div className="relative border border-mist p-8">
            <CornerOrnament corner="tl" className="h-12 w-12" />
            <CornerOrnament corner="br" className="h-12 w-12" />
            <h2 className="text-lg">Speak with Us</h2>
            <dl className="mt-5 space-y-4 text-lg">
              <div>
                <dt className="eyebrow text-ink-soft">Telephone</dt>
                <dd>
                  <a href="tel:+911412345678" className="link-thread">
                    +91 141 234 5678
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-soft">WhatsApp</dt>
                <dd>
                  <a href="https://wa.me/919876543210" className="link-thread" rel="noopener noreferrer" target="_blank">
                    +91 98765 43210
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-soft">Email</dt>
                <dd>
                  <a href="mailto:care@sarpech.in" className="link-thread">
                    care@sarpech.in
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-soft">Client care hours</dt>
                <dd>Mon–Sat · 10am – 7pm IST</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg">Our Ateliers</h2>
            <ul className="mt-5 space-y-6">
              {ATELIERS.map((a) => (
                <li key={a.city} className="border-l border-gold pl-5">
                  <h3 className="font-display text-sm tracking-[0.2em]">{a.city}</h3>
                  <address className="mt-1 text-lg not-italic">
                    {a.address.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                  <p className="text-base text-ink-soft">{a.hours}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

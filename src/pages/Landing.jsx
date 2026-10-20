import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plane,
  QrCode,
  Recycle,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  UsersRound,
} from 'lucide-react';
import { DashboardPreview } from '../components/DashboardPreview';

const navLinks = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#benefits' },
  { label: 'Contact', href: '#contact' },
];

const features = [
  {
    icon: CalendarCheck,
    title: 'Leave Management',
    body: 'Submit leave requests online without paper forms.',
  },
  {
    icon: Plane,
    title: 'Travel Orders',
    body: 'Generate and monitor official travel requests digitally.',
  },
  {
    icon: FileCheck2,
    title: 'Approval Workflow',
    body: 'Requests are automatically routed to the appropriate approving officers.',
  },
  {
    icon: QrCode,
    title: 'QR Code Verification',
    body: 'Verify approved documents quickly using QR codes.',
  },
  {
    icon: LayoutDashboard,
    title: 'Employee Portal',
    body: 'Track request status and manage personal records.',
  },
  {
    icon: FileText,
    title: 'Reports',
    body: 'Generate printable PDF reports and summaries.',
  },
  {
    icon: UsersRound,
    title: 'Role-Based Access',
    body: 'Separate access for Employees, Administrators, and Approvers.',
  },
  {
    icon: BellRing,
    title: 'Notifications',
    body: 'Stay updated on request approvals and status changes.',
  },
];

const steps = [
  { n: '01', icon: ClipboardList, title: 'Submit', body: 'Employee submits a leave or travel request.' },
  { n: '02', icon: UserCheck, title: 'Review', body: 'The request is reviewed by the assigned approver.' },
  { n: '03', icon: FileCheck2, title: 'Approve', body: 'Approval or revision is completed.' },
  {
    n: '04',
    icon: Download,
    title: 'Download',
    body: 'The approved document is available for download and verification.',
  },
];

const roles = [
  {
    icon: Users,
    title: 'Employee',
    items: [
      'Apply for leave',
      'Submit travel orders',
      'Track request status',
      'Download approved documents',
    ],
  },
  {
    icon: UserCheck,
    title: 'Approver',
    items: ['Review requests', 'Approve or reject applications', 'Add remarks'],
  },
  {
    icon: ShieldCheck,
    title: 'Administrator',
    items: [
      'Manage employees',
      'Configure system settings',
      'Generate reports',
      'Monitor system activity',
    ],
  },
];

const benefits = [
  {
    icon: Gauge,
    title: 'Faster Processing',
    body: 'Reduce processing time through automated workflows.',
  },
  {
    icon: Recycle,
    title: 'Paperless Transactions',
    body: 'Minimize paper usage by managing requests digitally.',
  },
  {
    icon: Lock,
    title: 'Secure Records',
    body: 'Maintain organized and secure employee documents in one system.',
  },
];

const highlights = [
  { icon: CalendarCheck, label: 'Digital Leave Applications' },
  { icon: Plane, label: 'Digital Travel Orders' },
  { icon: QrCode, label: 'QR Code Verification' },
  { icon: FileText, label: 'PDF Generation' },
  { icon: UsersRound, label: 'Role-Based Access' },
  { icon: History, label: 'Audit Trail' },
  { icon: Fingerprint, label: 'Secure Authentication' },
  { icon: Smartphone, label: 'Responsive Design' },
];

const securityPoints = [
  { icon: KeyRound, label: 'Secure login' },
  { icon: UsersRound, label: 'Role-based access control' },
  { icon: QrCode, label: 'QR document verification' },
  { icon: ShieldCheck, label: 'Data privacy compliance' },
  { icon: History, label: 'Audit logs' },
  { icon: Lock, label: 'Protected records' },
];

function SectionHeading({ eyebrow, title, body, center = false, bodyClassName = '', darkMode = false }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={`eyebrow ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-3xl font-extrabold sm:text-4xl ${darkMode ? 'text-emerald-100' : ''}`}>{title}</h2>
      {body ? <p className={`mt-4 leading-relaxed ${bodyClassName || (darkMode ? 'text-emerald-200' : 'text-slate-600')}`}>{body}</p> : null}
    </div>
  );
}

function Button({ variant = 'default', size = 'default', className = '', children, asChild, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    hero: 'bg-white text-emerald-950 hover:bg-emerald-300 shadow-lg',
    onHero: 'bg-emerald-950/30 text-white border border-white/30 hover:bg-emerald-950/40',
    default: 'bg-emerald-800 text-white hover:bg-emerald-900',
  };
  
  const sizes = {
    xl: 'px-8 py-4 text-lg',
    default: 'px-6 py-3 text-base',
  };
  
  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.default;
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${baseStyles} ${variantStyle} ${sizeStyle} ${children.props.className || ''}`,
      ...props,
    });
  }
  
  return (
    <button className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-slate-900 to-emerald-800">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">  
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <img src="/logo.png" alt="DENR Logo" className="size-9 rounded-xl" />
            <span className="hidden h-8 w-px bg-slate-200 sm:block" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-extrabold text-emerald-950">LeaveGo</span>
              <span className="text-xs text-slate-500">DENR CENRO Olongapo</span>
            </span>
          </a>
          <div className="ml-auto hidden gap-1 sm:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-700 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Button variant="default" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section id="top" className="relative overflow-hidden bg-gradient-to-br from-emerald-950 to-emerald-950 py-24 text-center text-white sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">
              Leave & Travel Management
              <br />
              Made Simple
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Streamline your leave requests and travel orders with DENR CENRO Olongapo's official digital management system.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/login">
                  Get Started <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button variant="onHero" size="xl" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-gradient-to-b from-emerald-800 to-emerald-900 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading center darkMode eyebrow="Features" title="Everything you need." />
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-emerald-700 bg-emerald-900/50 p-6 shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-emerald-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-200">{body}</p>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="about" className="scroll-mt-16 bg-gradient-to-b from-emerald-400 to-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading center darkMode eyebrow="How It Works" title="Simple 4-step process." />
            <div className="mt-14 grid gap-8 md:grid-cols-4">
              {steps.map(({ n, icon: Icon, title, body }) => (
                <div key={n} className="relative">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-950 font-display text-lg font-bold text-white">
                    {n}
                  </div>
                  <div className="mt-4">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950">
                      <Icon className="size-4" />
                    </span>
                    <h3 className="mt-3 text-lg font-extrabold text-emerald-100">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-100">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="bg-gradient-to-b from-emerald-800 to-emerald-950 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading center darkMode eyebrow="Roles" title="Built for every user." />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {roles.map(({ icon: Icon, title, items }) => (
                <div key={title} className="rounded-3xl border border-emerald-700 bg-emerald-900/50 p-8 shadow-md">
                  <span className="flex size-10 items-center justify-center rounded-full bg-emerald-950 font-display text-sm font-bold text-white">
                    <Icon className="size-5.5" />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold text-emerald-100">{title}</h3>
                  <ul className="mt-5 space-y-3">
                    {items.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-100">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="bg-gradient-to-b from-emerald-900 to-emerald-950 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading center darkMode eyebrow="Why Use LeaveGo" title="Built for how the office works." />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-9 text-white shadow-xl"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="size-5.5" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold text-emerald-100">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{body}</p>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-gradient-to-b from-emerald-800 to-emerald-950 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading center darkMode eyebrow="System Highlights" title="Capabilities at a glance." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-700 bg-emerald-900/50 px-5 py-4 text-sm font-semibold text-emerald-100 shadow-md"
                >
                  <Icon className="size-4.5 shrink-0 text-emerald-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="bg-gradient-to-b from-emerald-900 to-emerald-950 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionHeading
              darkMode
              center
              eyebrow="Security & Privacy"
              title="Secure and reliable."
              body="LeaveGo protects employee information through secure authentication, role-based access control, and compliance with organizational data management practices. The system is designed to support responsible handling of records in accordance with applicable data privacy requirements."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {securityPoints.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-emerald-700 bg-emerald-900/50 p-6 shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950">
                    <Icon className="size-4.5" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-emerald-100">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="login" className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
          <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 px-8 py-16 text-center text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Access LeaveGo?</h2>
              <p className="mx-auto mt-4 max-w-lg text-white/75">
                Sign in to manage leave requests and travel orders quickly and securely.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/login">
                    Login to LeaveGo <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="onHero" size="xl" asChild>
                  <a href="#contact">Contact Support</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-emerald-700 bg-gradient-to-b from-emerald-900 to-emerald-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="LeaveGo Logo" className="size-9 rounded-xl" />
              <span className="font-display text-lg font-extrabold text-emerald-100">LeaveGo</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-emerald-100">
              Department of Environment and Natural Resources
              <br />
              Community Environment and Natural Resources Office (CENRO) Olongapo
              <br />
              Official Leave &amp; Travel Management System
            </p>
          </div>

          <div>
            <p className="eyebrow text-emerald-100">Contact</p>
            <ul className="mt-5 space-y-3 text-sm text-emerald-200">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                CENRO Olongapo, Zambales
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                (047) 000-0000
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <a href="mailto:it@denr.gov.ph" className="transition-colors hover:text-emerald-100">
                  it@denr.gov.ph
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-emerald-100">System</p>
            <ul className="mt-5 space-y-3 text-sm text-emerald-200">
              <li>
                <a href="#features" className="transition-colors hover:text-emerald-100">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="transition-colors hover:text-emerald-100">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#security" className="transition-colors hover:text-emerald-100">
                  Terms of Use
                </a>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-emerald-100">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-700 px-5 py-6 text-center text-xs text-emerald-300 sm:px-6">
          © 2026 LeaveGo System · DENR CENRO Olongapo. Powered by DENR IT.
        </div>
      </footer>
    </div>
  );
}

export default Landing;

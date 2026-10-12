import { navItems } from '../data/mockData.js';

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-[248px] flex-col bg-sidebar px-[18px] pt-7 pb-5 text-sidebar-foreground max-[700px]:static max-[700px]:h-auto max-[700px]:w-full max-[700px]:p-[17px]">
      <div className="flex items-start gap-3 px-[11px] pb-12 max-[700px]:pb-5">
        <div className="flex h-[27px] items-end gap-[3px] pt-0.5" aria-hidden="true">
          <span className="block h-4 w-[5px] rounded-[5px] bg-sidebar-brand"></span>
          <span className="block h-6 w-[5px] rounded-[5px] bg-sidebar-brand"></span>
          <span className="block h-[11px] w-[5px] rounded-[5px] bg-sidebar-brand"></span>
        </div>
        <div>
          <p className="m-0 mb-1.5 font-mono text-[10px] tracking-[0.12em] text-sidebar-eyebrow">SMART CAMPUS OS</p>
          <h1 className="font-heading text-[17px] font-semibold leading-[1.12] tracking-[-0.03em]">
            Think Outside
            <br />
            The Box
          </h1>
        </div>
      </div>

      <nav className="grid gap-1.5 max-[700px]:flex max-[700px]:overflow-auto" aria-label="Primary navigation">
        {navItems.map((item, index) => {
          const isActive = index === 0;
          const linkClass = [
            'flex items-center gap-[13px] rounded-lg px-[13px] py-3 text-[13px] text-sidebar-nav no-underline transition-all duration-200',
            'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground max-[700px]:whitespace-nowrap',
            isActive ? 'bg-sidebar-hover text-sidebar-hover-foreground shadow-[inset_3px_0_var(--color-sidebar-accent)]' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <a key={item.id} className={linkClass} href={item.href}>
              <span className="w-[18px] text-center text-[18px] text-sidebar-icon">{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto max-[700px]:hidden">
        <div className="mb-4 flex items-center gap-2.5 border-y border-sidebar-border px-2.5 py-[17px]">
          <span className="h-2 w-2 rounded-full bg-sidebar-online shadow-[0_0_0_5px_var(--color-sidebar-online-ring)]"></span>
          <div>
            <strong className="block text-[12px] font-semibold">Network online</strong>
            <small className="mt-[3px] block text-[10px] text-sidebar-muted">Last sync · 32 sec ago</small>
          </div>
        </div>
        <button
          className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-2 py-[7px] text-left text-inherit"
          type="button"
        >
          <span className="grid h-[31px] w-[31px] place-items-center rounded-full bg-sidebar-avatar text-[10px] text-sidebar-avatar-foreground">
            AM
          </span>
          <span>
            <strong className="block text-[12px] font-semibold">Admin</strong>
            <small className="mt-[3px] block text-[10px] text-sidebar-muted">Campus ops</small>
          </span>
          <span className="ml-auto text-[18px] text-sidebar-chevron">⌄</span>
        </button>
      </div>
    </aside>
  );
}

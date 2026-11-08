import { Link } from "react-router-dom";

const linkCls = "hover:text-secondary transition-colors";

/** Thin top bar with commercial and contributor links (homepage only). */
export function UtilityBar() {
  return (
    <div className="bg-primary text-primary-foreground/80 text-xs">
      <div className="container mx-auto px-4 h-8 flex items-center gap-5 overflow-x-auto whitespace-nowrap">
        <a className={linkCls} href="mailto:advertise@businesshub.cy?subject=Advertising%20%26%20media%20kit">Advertise / Media Kit</a>
        <a className={linkCls} href="mailto:news@businesshub.cy?subject=Press%20release">Submit Press Release</a>
        <a className={linkCls} href="mailto:info@businesshub.cy">Contact</a>
        <a className={`${linkCls} ml-auto font-semibold text-secondary`} href="#newsletter">Free Newsletter</a>
        <Link className={linkCls} to="/directory">Directory</Link>
      </div>
    </div>
  );
}

import { ArrowRight, Compass } from 'lucide-react';
import './CollectionHero.css';

type Props = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  imageAlt: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  caption: string;
  captionDetail: string;
};
export function CollectionHero(props: Props) {
  const imageAtWidth = (width: number) => {
    if (props.image.startsWith('https://lh3.googleusercontent.com/aida-public/')) {
      return `${props.image.replace(/=w\d+.*$/, '')}=w${width}`;
    }
    if (props.image.startsWith('https://images.unsplash.com/')) {
      const url = new URL(props.image);
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', '90');
      return url.toString();
    }
    return props.image;
  };
  return <header className="collection-hero">
    <div className="collection-hero-copy">
      <span className="store-eyebrow">{props.eyebrow}</span>
      <h1>{props.title}<br /><span>{props.accent}</span></h1>
      <p>{props.description}</p>
      <div className="collection-hero-links">
        <a href={props.primary.href} className="store-button">{props.primary.label}<ArrowRight size={15} aria-hidden="true" /></a>
        <a href={props.secondary.href}>{props.secondary.label}<ArrowRight size={14} aria-hidden="true" /></a>
      </div>
    </div>
    <div className="collection-hero-art">
      <img
        src={imageAtWidth(1600)}
        srcSet={[800, 1200, 1600, 2000].map(width => `${imageAtWidth(width)} ${width}w`).join(', ')}
        sizes="(max-width: 700px) calc(100vw - 48px), (max-width: 1280px) 48vw, 590px"
        alt={props.imageAlt}
        fetchPriority="high"
      />
      <div className="collection-hero-caption"><Compass size={17} aria-hidden="true" /><span>{props.caption}<small>{props.captionDetail}</small></span></div>
    </div>
  </header>;
}

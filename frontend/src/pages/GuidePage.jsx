import { ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import GuideContent from '../components/schemes/GuideContent';
import Button from '../components/ui/Button';
export default function GuidePage() { const { schemeId } = useParams(); return <main className="page guide"><Button to="/alerts" className="button-ghost"><ArrowLeft size={14}/> Back to opportunities</Button><div className="guide-stack"><GuideContent schemeId={schemeId}/></div></main>; }

import { useState } from 'react';
import ProfileForm from '../components/profile/ProfileForm';
import PageHeader from '../components/ui/PageHeader';
import useProfile from '../hooks/useProfile';
export default function ProfilePage() { const { profile, updateField, save, isLoading, error } = useProfile(); const [saved, setSaved] = useState(false); const onChange = event => { const { name, value } = event.target; setSaved(false); updateField(name, ['age', 'income'].includes(name) ? (value ? Number(value) : null) : value); }; const onSubmit = async event => { event.preventDefault(); if (await save()) setSaved(true); }; return <main className="page"><PageHeader eyebrow="Your matching foundation" title="Tell us a little about yourself." description="Your details make scheme recommendations more accurate. You can update them anytime."/><ProfileForm form={profile} onChange={onChange} onSubmit={onSubmit} isSaving={isLoading} error={error} saved={saved}/></main>; }

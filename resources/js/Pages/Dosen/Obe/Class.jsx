import Index from './Index';

export default function Class({ kelasKuliah, cpmks = [], assessments = [] }) {
    return <Index selectedClass={kelasKuliah} cpmks={cpmks} achievements={assessments} />;
}

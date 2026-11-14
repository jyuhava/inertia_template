import Assessments from '../Assessments';

// Bukan re-export murni: Rollup menggabungkan modul re-export ke chunk
// induknya, sehingga entri halaman ini hilang dari Vite manifest dan
// Inertia gagal me-resolve-nya di build produksi.
export default function Index(props) {
    return <Assessments {...props} />;
}

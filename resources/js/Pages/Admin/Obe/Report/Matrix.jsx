import Report from '../Report';

export default function Matrix({ kurikulum, cpls = [], cpmks = [] }) {
    const mappings = cpls.flatMap((cpl) => (cpl.course_mappings || cpl.courseMappings || []).map((mapping) => ({ ...mapping, cpl_id: cpl.id })));
    const courses = mappings.map((mapping) => mapping.mata_kuliah || mapping.mataKuliah).filter(Boolean).filter((course, index, items) => items.findIndex((item) => item.id === course.id) === index);
    return <Report kurikulums={kurikulum ? [kurikulum] : []} filters={{ kurikulum_id: kurikulum?.id }} cpls={cpls} mataKuliahs={courses} cplCourseMatrix={mappings} cpmks={cpmks} />;
}

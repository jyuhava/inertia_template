import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Essentials,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    BlockQuote,
    Heading,
    Font,
    FontColor,
    FontBackgroundColor,
    Alignment,
    List,
    TodoList,
    Indent,
    IndentBlock,
    Link,
    AutoLink,
    Image,
    ImageInsert,
    ImageUpload,
    ImageResize,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    SimpleUploadAdapter,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    MediaEmbed,
    HorizontalLine,
    FindAndReplace,
    Paragraph,
    Undo,
    PasteFromOffice,
    RemoveFormat,
    SpecialCharacters,
    SpecialCharactersEssentials,
    CodeBlock,
    Code,
    Highlight,
    PageBreak,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

export default function RichTextEditor({ value, onChange, placeholder }) {
    return (
        <div className="bg-white rich-text-editor">
            <CKEditor
                editor={ClassicEditor}
                data={value || ''}
                config={{
                    // Use the latest token from cookie to avoid stale CSRF header after session/token rotation.
                    simpleUpload: (() => {
                        const xsrfToken = getCookie('XSRF-TOKEN');
                        const csrfMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        const headers = {
                            'X-Requested-With': 'XMLHttpRequest',
                        };

                        if (xsrfToken) {
                            headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
                        } else if (csrfMeta) {
                            headers['X-CSRF-TOKEN'] = csrfMeta;
                        }

                        return {
                            uploadUrl: `${window.location.origin}/upload/ckeditor`,
                            withCredentials: true,
                            headers,
                        };
                    })(),
                    licenseKey: 'GPL',
                    placeholder: placeholder || 'Tulis konten di sini...',
                    plugins: [
                        Essentials,
                        Bold,
                        Italic,
                        Underline,
                        Strikethrough,
                        Subscript,
                        Superscript,
                        BlockQuote,
                        Heading,
                        Font,
                        FontColor,
                        FontBackgroundColor,
                        Alignment,
                        List,
                        TodoList,
                        Indent,
                        IndentBlock,
                        Link,
                        AutoLink,
                        Image,
                        ImageInsert,
                        ImageUpload,
                        ImageResize,
                        ImageCaption,
                        ImageStyle,
                        ImageToolbar,
                        SimpleUploadAdapter,
                        Table,
                        TableToolbar,
                        TableProperties,
                        TableCellProperties,
                        MediaEmbed,
                        HorizontalLine,
                        FindAndReplace,
                        Paragraph,
                        Undo,
                        PasteFromOffice,
                        RemoveFormat,
                        SpecialCharacters,
                        SpecialCharactersEssentials,
                        CodeBlock,
                        Code,
                        Highlight,
                        PageBreak,
                    ],
                    toolbar: {
                        items: [
                            'undo', 'redo',
                            '|',
                            'heading',
                            '|',
                            'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
                            '|',
                            'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'code', 'removeFormat',
                            '|',
                            'alignment',
                            '|',
                            'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
                            '|',
                            'link', 'insertImage', 'insertTable', 'mediaEmbed', 'blockQuote', 'codeBlock', 'horizontalLine', 'pageBreak',
                            '|',
                            'highlight', 'specialCharacters', 'findAndReplace',
                        ],
                        shouldNotGroupWhenFull: true,
                    },
                    image: {
                        toolbar: [
                            'imageTextAlternative',
                            'imageStyle:inline',
                            'imageStyle:block',
                            'imageStyle:side',
                            '|',
                            'toggleImageCaption',
                            'imageResize',
                        ],
                        insert: {
                            type: 'auto',
                        },
                    },
                    table: {
                        contentToolbar: [
                            'tableColumn', 'tableRow', 'mergeTableCells',
                            'tableProperties', 'tableCellProperties',
                        ],
                    },
                    heading: {
                        options: [
                            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                            { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                        ],
                    },
                    link: {
                        addTargetToExternalLinks: true,
                    },
                }}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    if (onChange) {
                        onChange(data);
                    }
                }}
            />
        </div>
    );
}

import React, { useState, Component } from 'react';
import { EditorState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
export default function TextEditor(props) {
  const { setEditorState, editorState } = props;
  const onEditorStateChange = editorState => {
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    setEditorState(editorState);
    // form.change(name, draftToHtml(convertToRaw(editorState.getCurrentContent())));
  };
  return (
    <Editor
      editorState={editorState}
      toolbarClassName="toolbarClassName"
      wrapperClassName="wrapperClassName"
      editorClassName="editorClassName"
      onEditorStateChange={onEditorStateChange}
      toolbar={{
        options: ['inline', 'list', 'textAlign', 'link', 'emoji', 'remove', 'history'],
        inline: { inDropdown: false, options: ['bold', 'italic', 'underline'] },
        list: { inDropdown: false },
        textAlign: { inDropdown: false },
        link: { inDropdown: false },
        history: { inDropdown: false },
      }}
    />
  );
}

"use client"

import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

function Editor({ value }: { value: string }) {
  return <CodeMirror value={value} height="100%" extensions={[markdown()]} theme={vscodeDark} />;
}

export default Editor;
"use client"

import React from 'react';
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

function Editor({value, setValue}: any) {
  const onChange = React.useCallback((val: string, viewUpdate: ViewUpdate) => {
    // console.log({ val, viewUpdate });
    setValue(val);
  }, [setValue]);
  return <CodeMirror value={value} height="100%" extensions={[json()]} onChange={onChange} theme={vscodeDark} />;
}

export default Editor;
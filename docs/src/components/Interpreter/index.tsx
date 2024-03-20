import { useLayoutEffect, useRef, useState, MouseEvent, CSSProperties } from 'react';
import Markdown from 'react-markdown';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Head from '@docusaurus/Head';
import useScripts from '@site/src/hooks/useScripts';
import CodeBlock from '@theme/CodeBlock';
import { initTerminal, destroyTerminal } from './terminal';
import examples from './examples';

import './styles.css';

export interface TerminalProps extends CSSProperties {
  '--size': string;
}

const replReady = () => {
    return (
        globalThis.jQuery &&
        globalThis.jQuery.terminal &&
        globalThis.terminal &&
        globalThis.lips
    );
}

export default function Interpreter(): JSX.Element {
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [size, setSize] = useState(1);
  const ref = useRef<HTMLDivElement>();

  const isProd = process.env.NODE_ENV === 'production';
  const isBrowser = useIsBrowser();
  const isStatic = isProd && !isBrowser && !globalThis.jQuery;

  useScripts(!globalThis.jQuery && [
    'https://cdn.jsdelivr.net/npm/jquery',
    'https://cdn.jsdelivr.net/combine/npm/jquery.terminal/js/jquery.terminal.min.js,npm/js-polyfills/keyboard.js,npm/prismjs/prism.js,npm/jquery.terminal/js/prism.js,npm/prismjs/components/prism-scheme.min.js',
    'https://cdn.jsdelivr.net/gh/jcubic/lips@devel/lib/js/terminal.js',
    'https://cdn.jsdelivr.net/gh/jcubic/lips@devel/lib/js/prism.js'
  ]);

  useLayoutEffect(() => {
    (function loop() {
      if (replReady() && styleReady()) {
        initTerminal();
      } else {
        setTimeout(loop, 100);
      }
    })();
    return destroyTerminal;
  }, []);

  function onSnippetRun() {
    const $ = globalThis.jQuery;
    const code = $('.example:visible').text();
    const term = $('.term').terminal();
    term.echo(term.get_prompt(), { formatters: false });
    term.exec(code, true);
    if (typeof screen.orientation === 'undefined') {
      setTimeout(() => term.focus(), 0);
    }
  }

  function makeChangeSnippet(index: number) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setActiveSnippet(index);
    };
  }

  function sizeInrement(increment: number) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setSize(size => size + increment);
    };
  }

  function fullScreen(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const $ = globalThis.jQuery;
    $(document.body).addClass('full-screen');
  }

  function exitFullScreen(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const $ = globalThis.jQuery;
    $(document.body).removeClass('full-screen');
  }

  function styleReady() {
    // hack to prevent initalizaing of jQuery Terminal before style is loaded
    return !!getComputedStyle(ref.current).getPropertyValue('--base-background');
  }

  const terminalStyle = {
    '--size': size.toFixed(1)
  } as TerminalProps;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/combine/npm/jquery.terminal/css/jquery.terminal.min.css,npm/terminal-prism@0.4.1/css/prism-coy.css" rel="stylesheet"/>
        <link href="https://cdn.jsdelivr.net/gh/jcubic/lips@devel/lib/css/terminal.css"
              rel="stylesheet"/>
        {isStatic && <script src="https://cdn.jsdelivr.net/npm/jquery" />}
        {isStatic && <script src="https://cdn.jsdelivr.net/combine/npm/jquery.terminal/js/jquery.terminal.min.js,npm/js-polyfills/keyboard.js,npm/prismjs/prism.js,npm/jquery.terminal/js/prism.js,npm/prismjs/components/prism-scheme.min.js" />}
        {isStatic && <script src="https://cdn.jsdelivr.net/gh/jcubic/lips@devel/lib/js/terminal.js" />}
        {isStatic && <script src="https://cdn.jsdelivr.net/gh/jcubic/lips@devel/lib/js/prism.js" />}
        {!globalThis.lips && <script src="https://cdn.jsdelivr.net/gh/jcubic/lips@devel/dist/lips.min.js"
                                     data-bootstrap="https://cdn.jsdelivr.net/gh/jcubic/lips@devel/dist/std.xcb"/>}
      </Head>
      <div className="intro">
        <div className="actions-wrapper">
          <ul className="actions">
            <li className="zoom-in icon">
              <a href="#" onClick={sizeInrement(0.1)}>Zoom In</a>
            </li>
            <li className="zoom-out icon">
              <a href="#" onClick={sizeInrement(-0.1)}>Zoom Out</a>
            </li>
            <li className="full-screen">
              <ul>
                <li className="full-screen icon">
                  <a href="#" onClick={fullScreen}>Full Screen</a>
                </li>
                <li className="exit-full-screen icon">
                  <a href="#" onClick={exitFullScreen}>Exit Full Screen</a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="terminal marker" ref={ref}></div>
        <div className="term" style={terminalStyle}>
          <div className="loader-container">
            <div className="loader">
              <div>.</div>
              <div>..</div>
              <div>...</div>
              <div>....</div>
              <div>.....</div>
              <div>......</div>
            </div>
          </div>
        </div>
        <div className="examples terminal-external">
          <button className="run" onClick={onSnippetRun}>run</button>
          <ul className="list">
            {examples.map((example, index) => {
              return (
                <li key={index} className={index === activeSnippet ? 'active' : undefined}>
                  <div className="example">
                    <CodeBlock language="scheme" className="lips">
                      {example.code}
                    </CodeBlock>
                  </div>
                  <div className="description"><Markdown>{example.description}</Markdown></div>
                </li>
              );
            })}
          </ul>
          <ul className="pagination">
            {examples.map((_, index) => {
              return (
                <li key={index} className={index === activeSnippet ? 'active' : undefined}>
                  <a href="#" onClick={makeChangeSnippet(index)}>{ index + 1 }</a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

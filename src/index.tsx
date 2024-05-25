import { AdaptiveDpr, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { OrbitControls as OrbitControlsStdLib } from 'three-stdlib';
import { Canvas, useThree } from '@react-three/fiber';
import GUI from 'lil-gui';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Camera, CineonToneMapping, Scene, WebGLRenderer } from 'three';
import readme from '../README.md';
import { DemoBackgroundRemoval } from './DemoBackgroundRemoval';
import { DemoCustomShaders } from './DemoCustomShaders';
import { DemoFog } from './DemoFog';
import { DemoHelloWorld } from './DemoHelloWorld';
import { DemoLighting } from './DemoLighting';
import { DemoReactThreeFiber } from './DemoReactThreeFiber';
import { DemoTransmission } from './DemoTransmission';
import { IonPage, IonButton, IonInput, IonItem, IonList, IonIcon, IonSearchbar, IonLabel, IonModal, setupIonicReact } from '@ionic/react';
import IonDrawer from './IonDrawer';
import IonFlyingModal from './IonFlyingModal';
import { enterOutline, paperPlane } from 'ionicons/icons';
import { CupertinoPane } from 'cupertino-pane';

setupIonicReact();

export type DemoProps = {
	renderer: WebGLRenderer,
	scene: Scene,
	camera: Camera,
	controls: OrbitControlsStdLib,
	gui: GUI,
}

type DemoFn =
	(props: DemoProps)
		=> { dispose: () => void } | void;

const demos = {
	basic: {
		"getting-started": DemoHelloWorld,
		"three-fog": DemoFog,
		"background-removal": DemoBackgroundRemoval,
		"scene-lighting": DemoLighting,
		"custom-shaders": DemoCustomShaders,
		"transmission": DemoTransmission,
	} as Record<string, DemoFn>,
	react: {
		"react-three-fiber": DemoReactThreeFiber
	} as Record<string, React.FC<{ gui: GUI }>>
}

let globalGUI: GUI | null = null;

function DemoScene(props: {
	expanded: boolean,
	demoBasicFn: DemoFn | null,
	demoReactFn: React.FC<{ gui: GUI }> | null,
	onExpandToggle: (expanded: boolean) => void,
}) {
	let { scene, gl: renderer, camera } = useThree();
	
	let [gui, setGUI] = useState<GUI | null>(globalGUI);
	let [autoRotate, setAutoRotate] = useState(true);
	let [showUI, setShowUI] = useState(true);
	let controlsRef = useRef<OrbitControlsStdLib | null>(null);

	useEffect(() => {
		globalGUI?.destroy();

		globalGUI = new GUI({
			container: renderer.domElement.parentElement!,
		});
		globalGUI.close();
		globalGUI.domElement.style.position = 'absolute';
		globalGUI.domElement.style.top = '0';
		globalGUI.domElement.style.right = '0';
		globalGUI.domElement.style.zIndex = '1000';
		globalGUI.domElement.addEventListener('pointerdown', (e) => {
			e.stopPropagation();
		});

		let pixelRatioProxy = {
			get pixelRatio() {
				return renderer.getPixelRatio()
			},
			set pixelRatio(value: number) {
				renderer.setPixelRatio(value);

				// update url parameter
				let url = new URL(window.location.href);
				url.searchParams.set('pixelRatio', value.toString());
				window.history.replaceState({}, '', url.href);
			}
		}
		// initial pixel ratio from url parameter if available
		const url = new URL(window.location.href);
		let pixelRatioParam = url.searchParams.get('pixelRatio');
		if (pixelRatioParam != null) {
			pixelRatioProxy.pixelRatio = parseFloat(pixelRatioParam);
		}
		
		globalGUI.add(pixelRatioProxy, 'pixelRatio', 0.5, window.devicePixelRatio, 0.25).name('Pixel Ratio');

		setGUI(globalGUI);

		let demoProps = {
			renderer,
			scene,
			camera,
			controls: controlsRef.current!,
			gui: globalGUI,
		}

		if (props.demoBasicFn) {
			let demoDispose = props.demoBasicFn(demoProps)?.dispose;

			return () => {
				// call .dispose() on all objects in the scene
				scene.traverse((obj) => {
					(obj as any).dispose?.();
				});

				demoDispose?.();

				renderer.dispose();

				globalGUI?.destroy();
				globalGUI = null;
			}
		}
	}, []);

	useEffect(() => {
		// h key to hide/show gui
		function toggleGUI(e: KeyboardEvent) {
			if (e.key === 'h') {
				if (showUI) {
					gui?.hide();
					setShowUI(false);
				} else {
					gui?.show();
					setShowUI(true);
				}
			}
		}

		window.addEventListener('keydown', toggleGUI);

		let expandButton = document.createElement('div');
		expandButton.style.visibility = showUI ? 'visible' : 'hidden';
		expandButton.className = 'expand-button ' + (props.expanded ? 'icon-compress' : 'icon-expand');
		expandButton.onclick = () => {
			props.onExpandToggle(!props.expanded);
		}
		renderer.domElement.parentElement!.prepend(expandButton);

		return () => {
			window.removeEventListener('keydown', toggleGUI);
			expandButton.remove();
		}
	}, [props.expanded, showUI, gui]);

	return <>
		<PerspectiveCamera />
		<OrbitControls
			ref={controlsRef}
			autoRotate={autoRotate}
			autoRotateSpeed={0.5}
			enableDamping={true}
			// disable auto rotation when user interacts
			onStart={() => {
				setAutoRotate(false);
			}}
			makeDefault
		/>
		{props.demoReactFn && gui && <props.demoReactFn gui={gui} />}
	</>
}

function App() {
	const modalRef = useRef<CupertinoPane>();
	const inputRef = useRef<HTMLIonInputElement>(null);
	const demoKeys = Object.keys(demos.basic).concat(Object.keys(demos.react));

	const [demoKey, setDemoKey] = useState<string | null>(() => {
		// get url parameter
		const url = new URL(window.location.href);
		let demoParam = url.hash.replace(/^#/, '');
		let demoExists = demoParam != null && demoKeys.includes(demoParam);
		return demoExists ? demoParam : demoKeys[0];
	});
	
	const [showDocs, setShowDocs] = useState(() => {
		// get url parameter
		const url = new URL(window.location.href);
		return url.searchParams.get('hide-docs') == null;
	});

	useEffect(() => {
		// update hide-docs url parameter
		let url = new URL(window.location.href);
		if (!showDocs) {
			url.searchParams.set('hide-docs', '');
		} else {
			url.searchParams.delete('hide-docs');
		}
		window.history.replaceState({}, '', url.href);
	}, [showDocs]);

	const demoBasicFn = demoKey != null ? demos.basic[demoKey] : null;
	const demoReactFn = demoKey != null ? demos.react[demoKey] : null;
	const hasDemo = demoBasicFn != null || demoReactFn != null;
	
	useEffect(() => {
		// react to url changes
		window.addEventListener('hashchange', () => {
			setDemoKey(window.location.hash.replace(/^#/, ''));
		});

		// scroll to demo
		if (demoKey) {
			document.getElementById(demoKey)?.scrollIntoView({ behavior: 'smooth' });
		}

		// press e to expand demo
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'e') {
				setShowDocs(e => !e);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		}
	}, []);

	return <>

		{hasDemo && <Canvas
			className='demo-canvas'
			gl={{
				antialias: false,
				toneMapping: CineonToneMapping,
			}}
			key={demoKey}
			onPointerDown={(e) => {
				// prevent text selection
				e.preventDefault();
			}}
		>
			<AdaptiveDpr pixelated />
			<DemoScene
				key={demoKey}
				expanded={!showDocs}
				onExpandToggle={(expanded) => {
					setShowDocs(!expanded);
				}}
				demoBasicFn={demoBasicFn}
				demoReactFn={demoReactFn}
			/>
		</Canvas>}

		<div className='test'>
			<div className='top-bar'>
				<IonSearchbar 
					placeholder="Where to?" 
					class="custom" 
					onIonFocus={() => {
						modalRef.current?.present({animate: true})
					}}
				/>
			</div>
			<IonFlyingModal innerRef={modalRef} inputRef={inputRef} panelKey="modal">
				<IonList lines='none'>
					<IonItem>
						<IonInput ref={inputRef} label="Take me to" placeholder="the heart of Singapore" clearInput={true}>
							<IonButton slot="end" aria-label="Go" >GO</IonButton>
						</IonInput>
					</IonItem>
				</IonList>
			</IonFlyingModal>
		</div>
	</>
}

const reactRoot = document.getElementById('react-root');
createRoot(reactRoot!).render(<App />);
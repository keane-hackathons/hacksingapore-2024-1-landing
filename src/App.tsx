import { AdaptiveDpr } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import GUI from 'lil-gui';
import React, { useEffect, useRef, useState } from 'react';
import { CineonToneMapping } from 'three';
import { DemoReactThreeFiber } from './DemoReactThreeFiber';
import { DemoTransmission } from './DemoTransmission';
import { IonButton, IonInput, IonItem, IonList, IonSearchbar } from '@ionic/react';
import IonFlyingModal from './IonFlyingModal';
import { CupertinoPane } from 'cupertino-pane';
import DemoScene, { DemoFn } from './DemoScene';

const demos = {
	basic: {
		"transmission": DemoTransmission,
	} as Record<string, DemoFn>,
	react: {
		"react-three-fiber": DemoReactThreeFiber
	} as Record<string, React.FC<{ gui: GUI }>>
}

export default function App() {
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
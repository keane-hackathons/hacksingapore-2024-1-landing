import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { OrbitControls as OrbitControlsStdLib } from 'three-stdlib';
import { useThree } from '@react-three/fiber';
import GUI from 'lil-gui';
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Scene, WebGLRenderer } from 'three';

export type DemoProps = {
	renderer: WebGLRenderer,
	scene: Scene,
	camera: Camera,
	controls: OrbitControlsStdLib,
	gui: GUI,
}

export type DemoFn =
	(props: DemoProps)
		=> { dispose: () => void } | void;

let globalGUI: GUI | null = null;

export default function DemoScene(props: {
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
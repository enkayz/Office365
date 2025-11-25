import React, {useEffect, useMemo, useState} from 'react';
import {render, Text, Box, useApp, useInput} from 'ink';
import path from 'node:path';
import fs from 'node:fs';
import {spawn} from 'node:child_process';

// Config: where to scan for scripts
const repoRoot = path.resolve(process.cwd(), '..'); // run from tui/, scan parent

const PWSH_BIN = process.env.PWSH_BIN || (process.platform === 'win32' ? 'powershell' : 'pwsh');

// Utility to get .ps1 scripts from repo root (non-recursive for simplicity)
const listScripts = (): string[] => {
	try {
		const entries = fs.readdirSync(repoRoot, {withFileTypes: true});
		return entries
			.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.ps1'))
			.map(e => e.name)
			.sort((a, b) => a.localeCompare(b));
	} catch (e) {
		return [];
	}
};

const curatedConnectScripts = [
	'o365-connect.ps1',
	'o365-connect-exo.ps1',
	'mggraph-connect.ps1',
	'o365-connect-spo.ps1',
	'o365-connect-pnp.ps1',
	'az-connect.ps1',
	'az-connect-si.ps1'
];

const isConnectLike = (name: string) => /connect|setup/i.test(name);

type RunnerProps = {
	scriptName: string;
	args?: string[];
	onExit?: (code: number | null) => void;
};

const Runner: React.FC<RunnerProps> = ({scriptName, args = [], onExit}) => {
	const [lines, setLines] = useState<string[]>([]);
	const {exit} = useApp();

	useEffect(() => {
		const scriptPath = path.join(repoRoot, scriptName);
		const pwshArgs: string[] = [];
		if (process.platform === 'win32') {
			pwshArgs.push('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args);
		} else {
			pwshArgs.push('-NoProfile', '-File', scriptPath, ...args);
		}
		const child = spawn(PWSH_BIN, pwshArgs, {cwd: repoRoot});

		child.stdout.on('data', (d: Buffer) => setLines(prev => [...prev, d.toString()]));
		child.stderr.on('data', (d: Buffer) => setLines(prev => [...prev, d.toString()]));
		child.on('close', code => {
			onExit?.(code);
		});
		child.on('error', err => setLines(prev => [...prev, String(err)]));

		return () => {
			child.kill('SIGTERM');
		};
	}, [scriptName, JSON.stringify(args)]);

	useInput((input, key) => {
		if (key.escape || (key.ctrl && input.toLowerCase() === 'c')) {
			exit();
		}
	});

	return (
		<Box flexDirection="column">
			<Text>
				Running {scriptName} {args.join(' ')} (shell: {PWSH_BIN}) — Press ESC/Ctrl+C to exit
			</Text>
			<Box borderStyle="round" paddingX={1} paddingY={0} flexDirection="column">
				{lines.length === 0 ? <Text dimColor>Waiting for output…</Text> : lines.map((l, i) => (
					<Text key={i}>{l.replace(/\n+$/,'')}</Text>
				))}
			</Box>
		</Box>
	);
};

const Menu: React.FC<{items: string[]; onSelect: (i: number) => void; title?: string; footer?: string;}> = ({items, onSelect, title, footer}) => {
	const [idx, setIdx] = useState(0);
	useInput((input, key) => {
		if (key.upArrow) setIdx(i => (i - 1 + items.length) % items.length);
		else if (key.downArrow) setIdx(i => (i + 1) % items.length);
		else if (key.return) onSelect(idx);
	});
	return (
		<Box flexDirection="column">
			{title && <Text>{title}</Text>}
			{items.map((it, i) => (
				<Text key={it} color={i === idx ? 'cyan' : undefined}>
					{i === idx ? '› ' : '  '}{it}
				</Text>
			))}
			{footer && <Text dimColor>{footer}</Text>}
		</Box>
	);
};

const ToggleRow: React.FC<{label: string; value: boolean}> = ({label, value}) => (
	<Text>{value ? '☑' : '☐'} {label}</Text>
);

const Wizard: React.FC<{onDone: () => void}> = ({onDone}) => {
	const all = useMemo(() => listScripts(), []);
	const connects = curatedConnectScripts.filter(s => all.includes(s));
	const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
	const [selectedConnect, setSelectedConnect] = useState<string | null>(connects[0] ?? null);
	const [flags, setFlags] = useState({noprompt: false, noupdate: false, debug: false});
	const [running, setRunning] = useState<{script: string; args: string[]} | null>(null);
	const nonConnectTasks = useMemo(() => all.filter(s => !isConnectLike(s)), [all]);
	const [taskIdx, setTaskIdx] = useState(0);
	const [connectIdx, setConnectIdx] = useState(0);

	useInput((input, key) => {
		if (running) return; // ignore during run
		if (key.escape) onDone();
		if (step === 2) {
			if (input.toLowerCase() === 'p') setFlags(f => ({...f, noprompt: !f.noprompt}));
			if (input.toLowerCase() === 'u') setFlags(f => ({...f, noupdate: !f.noupdate}));
			if (input.toLowerCase() === 'd') setFlags(f => ({...f, debug: !f.debug}));
		}
	});

	if (running) {
		return (
			<Runner
				scriptName={running.script}
				args={running.args}
				onExit={() => {
					setRunning(null);
					setStep(s => (s === 3 ? 4 : s));
				}}
			/>
		);
	}

	if (step === 1) {
		if (connects.length === 0) {
			return (
				<Box flexDirection="column">
					<Text>Could not find any connect scripts in parent folder.</Text>
					<Text dimColor>Press ESC to go back.</Text>
				</Box>
			);
		}
		return (
			<Box flexDirection="column">
				<Text>Step 1 — Select a connect script</Text>
				<Menu
					items={connects}
					onSelect={(i) => {
						setConnectIdx(i);
						setSelectedConnect(connects[i]);
						setStep(2);
					}}
					footer="Use ↑/↓ and Enter. ESC to exit."
				/>
			</Box>
		);
	}

	if (step === 2) {
		return (
			<Box flexDirection="column">
				<Text>Step 2 — Choose flags (press keys to toggle)</Text>
				<ToggleRow label="-noprompt (key: p)" value={flags.noprompt} />
				<ToggleRow label="-noupdate (key: u)" value={flags.noupdate} />
				<ToggleRow label="-debug (key: d)" value={flags.debug} />
				<Text dimColor>Press Enter to run, ESC to cancel.</Text>
				<RunOnEnter onEnter={() => {
					if (!selectedConnect) return;
					const args = [
						flags.noprompt ? '-noprompt' : '',
						flags.noupdate ? '-noupdate' : '',
						flags.debug ? '-debug' : ''
					].filter(Boolean);
					setRunning({script: selectedConnect, args});
					setStep(3);
				}} />
			</Box>
		);
	}

	if (step === 3) {
		return (
			<Box flexDirection="column">
				<Text>Step 3 — Select a task to run</Text>
				<Menu
					items={nonConnectTasks}
					onSelect={(i) => {
						setTaskIdx(i);
						setRunning({script: nonConnectTasks[i], args: []});
					}}
					footer="Use ↑/↓ and Enter. ESC to exit."
				/>
			</Box>
		);
	}

	// step 4
	return (
		<Box flexDirection="column">
			<Text color="green">Done. Connection step finished.</Text>
			<Text dimColor>Press ESC to return to main menu.</Text>
		</Box>
	);
};

const RunOnEnter: React.FC<{onEnter: () => void}> = ({onEnter}) => {
	useInput((_, key) => {
		if (key.return) onEnter();
	});
	return null;
};

const Advanced: React.FC<{onDone: () => void}> = ({onDone}) => {
	const all = useMemo(() => listScripts(), []);
	const [query, setQuery] = useState('');
	const filtered = useMemo(
		() => all.filter(n => n.toLowerCase().includes(query.toLowerCase())),
		[all, query]
	);
	const [idx, setIdx] = useState(0);
	const [flags, setFlags] = useState({noprompt: false, noupdate: false, debug: false});
	const [running, setRunning] = useState<{script: string; args: string[]} | null>(null);

	useInput((input, key) => {
		if (running) return;
		if (key.escape) onDone();
		if (key.upArrow) setIdx(i => Math.max(0, i - 1));
		else if (key.downArrow) setIdx(i => Math.min(filtered.length - 1, i + 1));
		else if (key.return) {
			const script = filtered[idx];
			const args = isConnectLike(script)
				? [flags.noprompt ? '-noprompt' : '', flags.noupdate ? '-noupdate' : '', flags.debug ? '-debug' : ''].filter(Boolean)
				: [];
			setRunning({script, args});
		}
		else if (key.backspace || key.delete) setQuery(q => q.slice(0, -1));
		else if (input && input.length === 1 && !key.ctrl && !key.meta) setQuery(q => q + input);
		// Toggles
		if (input.toLowerCase() === 'p') setFlags(f => ({...f, noprompt: !f.noprompt}));
		if (input.toLowerCase() === 'u') setFlags(f => ({...f, noupdate: !f.noupdate}));
		if (input.toLowerCase() === 'd') setFlags(f => ({...f, debug: !f.debug}));
	});

	if (running) {
		return (
			<Runner
				scriptName={running.script}
				args={running.args}
				onExit={() => setRunning(null)}
			/>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>Advanced Mode — search and run any script</Text>
			<Text>
				Query: <Text color="cyan">{query || '(type to filter)'}</Text>
			</Text>
			<Box gap={2}>
				<ToggleRow label="-noprompt (p)" value={flags.noprompt} />
				<ToggleRow label="-noupdate (u)" value={flags.noupdate} />
				<ToggleRow label="-debug (d)" value={flags.debug} />
			</Box>
			<Box flexDirection="column" marginTop={1}>
				{filtered.length === 0 ? (
					<Text dimColor>No matches.</Text>
				) : (
					filtered.slice(0, 20).map((name, i) => (
						<Text key={name} color={i === idx ? 'cyan' : undefined}>
							{i === idx ? '› ' : '  '}{name}
						</Text>
					))
				)}
			</Box>
			<Text dimColor>Use ↑/↓ to select, Enter to run, type to filter, ESC to exit. Flags apply to connect/setup scripts.</Text>
		</Box>
	);
};

const App: React.FC = () => {
	const [mode, setMode] = useState<'menu' | 'wizard' | 'advanced'>('menu');
	const items = ['Wizard Mode', 'Advanced Mode', 'Quit'];
	return (
		<Box flexDirection="column">
			<Text color="green">Office365 Scripts TUI</Text>
			{mode === 'menu' && (
				<Menu
					items={items}
					onSelect={(i) => {
						if (i === 0) setMode('wizard');
						else if (i === 1) setMode('advanced');
						else process.exit(0);
					}}
					footer="Use ↑/↓ and Enter to choose."
				/>
			)}
			{mode === 'wizard' && <Wizard onDone={() => setMode('menu')} />}
			{mode === 'advanced' && <Advanced onDone={() => setMode('menu')} />}
		</Box>
	);
};

render(<App />);

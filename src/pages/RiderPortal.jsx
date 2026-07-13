import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MapPin, FileBarChart2 } from 'lucide-react';
import riderApi from '../lib/riderApi';
import { formatDate } from '../lib/format';
import { useRiderAuthStore } from '../store/riderAuthStore';
import { useToastStore } from '../store/toastStore';
import { confirmDialog } from '../store/dialogStore';

export default function RiderPortal() {
	const rider = useRiderAuthStore((s) => s.rider);
	const mustSetPassword = useRiderAuthStore((s) => s.mustSetPassword);
	const storeLogin = useRiderAuthStore((s) => s.login);
	const passwordSet = useRiderAuthStore((s) => s.passwordSet);
	const logout = useRiderAuthStore((s) => s.logout);
	const toast = useToastStore((s) => s.show);
	const [form, setForm] = useState({ phone: '', credential: '' });
	const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
	const [orders, setOrders] = useState([]);
	const [error, setError] = useState('');
	const [pwError, setPwError] = useState('');
	const [loading, setLoading] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [confirming, setConfirming] = useState(null);
	const [justDelivered, setJustDelivered] = useState([]);

	const loadDeliveries = () => {
		setLoading(true);
		riderApi
			.get('/rider/deliveries')
			.then((res) => setOrders(res.data.orders))
			.catch((err) => {
				if (err.response?.status === 401)
					logout(); // expired token
				else if (err.response?.data?.code !== 'PASSWORD_SETUP_REQUIRED') {
					setError(err.response?.data?.error || 'Could not load deliveries');
				}
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		if (rider && !mustSetPassword) loadDeliveries();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const login = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const { data } = await riderApi.post('/rider/login', form);
			storeLogin(data.token, data.rider, data.mustSetPassword);
			setForm({ phone: '', credential: '' });
			if (!data.mustSetPassword) {
				const res = await riderApi.get('/rider/deliveries');
				setOrders(res.data.orders);
			}
		} catch (err) {
			setError(err.response?.data?.error || 'Sign in failed');
		} finally {
			setLoading(false);
		}
	};

	const submitPassword = async (e) => {
		e.preventDefault();
		setPwError('');
		if (pwForm.password.length < 6)
			return setPwError('Password must be at least 6 characters');
		if (pwForm.password !== pwForm.confirm)
			return setPwError('Passwords do not match');
		setSavingPassword(true);
		try {
			const { data } = await riderApi.post('/rider/set-password', {
				password: pwForm.password,
			});
			passwordSet(data.token);
			setPwForm({ password: '', confirm: '' });
			loadDeliveries();
		} catch (err) {
			setPwError(err.response?.data?.error || 'Failed to set password');
		} finally {
			setSavingPassword(false);
		}
	};

	const confirmDelivery = async (order) => {
		const ok = await confirmDialog({
			title: 'Confirm Delivery',
			message: `Confirm that order ${order.orderNumber} has been delivered to ${order.User?.firstName || order.guestName}?`,
			confirmLabel: 'Confirm Delivery',
		});
		if (!ok) return;
		setConfirming(order.id);
		try {
			await riderApi.post(`/rider/deliveries/${order.id}/confirm`);
			setJustDelivered((d) => [...d, order.orderNumber]);
			setOrders((os) => os.filter((o) => o.id !== order.id));
		} catch (err) {
			toast(err.response?.data?.error || 'Failed to confirm delivery', 'error');
		} finally {
			setConfirming(null);
		}
	};

	const inputClass =
		'w-full px-4 py-3 rounded-lg border border-black/15 bg-white text-sm focus:outline-none focus:border-gold';
	const labelClass = 'flex flex-col gap-1 text-xs font-medium text-black/60';

	if (!rider) {
		return (
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-sm">
					<h1 className="font-display text-4xl text-center">Rider Sign In</h1>
					<p className="mt-2 text-sm text-black/40 text-center">
						New riders: enter the PIN sent to you by SMS. Already set a
						password? Enter that instead.
					</p>
					<form onSubmit={login} className="mt-8 space-y-3">
						<label className={labelClass}>
							Phone number * (e.g. 233241234567)
							<input
								required
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							PIN or Password *
							<input
								required
								type="password"
								value={form.credential}
								onChange={(e) =>
									setForm({ ...form, credential: e.target.value })
								}
								className={inputClass}
							/>
						</label>
						{error && <p className="text-red-600 text-sm">{error}</p>}
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-40"
						>
							{loading ? 'Signing in…' : 'Sign In'}
						</button>
						<p className="text-xs text-black/40 text-center">
							Forgot your password? Ask the shop admin to reset your PIN —
							you'll receive a new one by SMS.
						</p>
					</form>
				</div>
			</div>
		);
	}

	if (mustSetPassword) {
		return (
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-sm">
					<h1 className="font-display text-4xl text-center">
						Set Your Password
					</h1>
					<p className="mt-2 text-sm text-black/40 text-center">
						Welcome, {rider.name}. For security, set a password now — you'll use
						it to sign in from now on instead of the PIN.
					</p>
					<form onSubmit={submitPassword} className="mt-8 space-y-3">
						<label className={labelClass}>
							New password * (min. 6 characters)
							<input
								required
								type="password"
								value={pwForm.password}
								onChange={(e) =>
									setPwForm({ ...pwForm, password: e.target.value })
								}
								className={inputClass}
							/>
						</label>
						<label className={labelClass}>
							Confirm password *
							<input
								required
								type="password"
								value={pwForm.confirm}
								onChange={(e) =>
									setPwForm({ ...pwForm, confirm: e.target.value })
								}
								className={inputClass}
							/>
						</label>
						{pwError && <p className="text-red-600 text-sm">{pwError}</p>}
						<button
							type="submit"
							disabled={savingPassword}
							className="w-full py-3 rounded-full bg-ink text-white text-sm hover:bg-gold transition-colors disabled:opacity-40"
						>
							{savingPassword ? 'Saving…' : 'Set Password & Continue'}
						</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full mx-auto max-w-2xl px-4 py-12">
			<div className="flex items-center justify-between gap-3">
				<h1 className="font-display text-4xl">Hello, {rider.name}</h1>
				<Link
					to="/rider/report"
					className="shrink-0 flex items-center gap-1.5 text-sm text-gold hover:underline"
				>
					<FileBarChart2 size={16} strokeWidth={2} /> My Report
				</Link>
			</div>

			{justDelivered.map((num) => (
				<p
					key={num}
					className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 flex items-center gap-2"
				>
					<Check size={16} strokeWidth={2.5} className="shrink-0" />
					{num} confirmed as delivered. The customer has been notified by SMS.
				</p>
			))}

			<h2 className="font-display text-2xl mt-8">
				{loading
					? 'Loading deliveries…'
					: orders.length
						? `${orders.length} dispatched ${orders.length === 1 ? 'delivery' : 'deliveries'}`
						: 'No deliveries dispatched to you yet'}
			</h2>
			{error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

			<div className="mt-4 space-y-4">
				{orders.map((order) => (
					<div
						key={order.id}
						className="bg-white border border-black/5 rounded-lg p-5"
					>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="font-mono text-sm">{order.orderNumber}</p>
								<p className="text-xs text-black/40 mt-0.5">
									Ordered {formatDate(order.createdAt)}
								</p>
							</div>
							<span className="text-xs px-2 py-1 rounded-full capitalize bg-orange-100 text-orange-800">
								{order.status.replace(/_/g, ' ')}
							</span>
						</div>
						<ul className="mt-3 text-sm text-black/70">
							{order.OrderItems?.map((item) => (
								<li key={item.id}>
									{item.quantity}× {item.Product?.name}
								</li>
							))}
						</ul>
						<div className="mt-3 text-sm">
							<p className="text-gold flex items-center gap-1.5">
								<MapPin size={14} strokeWidth={2} className="shrink-0" />{' '}
								{order.shippingAddress}
							</p>
							<p className="mt-1 text-black/60">
								{order.User ? `${order.User.firstName} ${order.User.lastName}` : order.guestName}
								{(order.User?.phoneNumber || order.guestPhone) && (
									<>
										{' '}
										·{' '}
										<a
											href={`tel:${order.User?.phoneNumber || order.guestPhone}`}
											className="text-gold hover:underline"
										>
											{order.User?.phoneNumber || order.guestPhone}
										</a>
									</>
								)}
							</p>
						</div>
						<button
							onClick={() => confirmDelivery(order)}
							disabled={confirming === order.id}
							className="mt-4 w-full py-3 rounded-full bg-green-700 text-white text-sm hover:bg-green-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
						>
							{confirming === order.id ? (
								'Confirming…'
							) : (
								<>
									Confirm Delivery <Check size={16} strokeWidth={2.5} />
								</>
							)}
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

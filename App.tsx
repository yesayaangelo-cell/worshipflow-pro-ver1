import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Calendar, Users, Search, Clock, LogOut, Plus, X, Trash2, Edit3, 
  UserPlus, ListMusic, Lock, PanelLeftClose, PanelLeftOpen, AlertTriangle, Share2, 
  Check, User, Music, Church, KeyRound, Phone, Heart, Copy, ExternalLink
} from 'lucide-react';

// --- FIREBASE INTEGRATION ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc
} from "firebase/firestore";

// CONFIG FIREBASE LO
const firebaseConfig = {
  apiKey: "AIzaSyDf73I2plTPUcvSB6FIMSAv6AWiHtz6RJ0",
  authDomain: "worship-flow-pro.firebaseapp.com",
  projectId: "worship-flow-pro",
  storageBucket: "worship-flow-pro.firebasestorage.app",
  messagingSenderId: "341401552075",
  appId: "1:341401552075:web:69c3abf324e7f31fa9074e"
};

// INIT FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- CONSTANTS & TYPES ---
const STANDARD_ROLES = ['Worship Leader', 'Singer', 'Keyboard', 'Guitar', 'Bass', 'Drums', 'Multimedia', 'Soundman'];
const MEMBER_LIMIT = 50;
const EVENT_LIMIT = 20;

interface Member { id: string; name: string; roles: string[]; phone: string; status: string; avatar: string; ownerId: string; }
interface Event { id: string; name: string; date: string; time: string; category: string; ownerId: string; }
interface Assignment { id: string; eventId: string; role: string; memberId: string; ownerId: string; }
interface Song { id: string; eventId: string; title: string; key: string; notes: string; ownerId: string; }
interface AdminProfile { churchName: string; adminName: string; }
type AppTab = 'dashboard' | 'schedule' | 'team';

// --- COMPONENTS ---

const WorshipFlowLogo = ({ size = "md", showText = false, className = "", collapsed = false }: any) => {
  const dimensions: any = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-24 h-24", xl: "w-48 h-48" };
  return (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${className}`}>
      <div className={`${dimensions[size]} relative group`}>
        <div className="absolute inset-0 bg-[#C0FF00] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full scale-150"></div>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-xl">
          <path d="M50 5C25.1472 5 5 25.1472 5 50C5 74.8528 25.1472 95 50 95C74.8528 95 95 74.8528 95 50" stroke="#C0FF00" strokeWidth="2" strokeLinecap="round" className="opacity-20"/>
          <path d="M50 85C65 85 75 75 75 60C75 45 60 40 50 20C40 40 25 45 25 60C25 75 35 85 50 85Z" fill="#C0FF00"/>
          <path d="M50 85C58 85 64 80 64 72C64 64 56 62 50 50C44 62 36 64 36 72C36 80 42 85 50 85Z" fill="black" className="opacity-40"/>
        </svg>
      </div>
      {showText && !collapsed && (
        <div className="mt-6 text-center animate-in fade-in duration-500">
          <h1 className="text-4xl font-black tracking-tighter text-[#FFFFFF] leading-none">Worship<span className="text-[#C0FF00]">Flow</span></h1>
          <p className="mt-2 text-[10px] font-bold text-[#888888] uppercase tracking-[0.4em]">Your Tech Worship Partner</p>
        </div>
      )}
    </div>
  );
};

const Toast = ({ message, show }: { message: string, show: boolean }) => (
  <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
    <div className="bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#262626] backdrop-blur-xl">
      <div className="bg-[#C0FF00]/20 text-[#C0FF00] p-1.5 rounded-lg shrink-0"><Check size={18} strokeWidth={3} /></div>
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">{message}</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-[#262626] flex flex-col max-h-[90vh] relative z-10">
        <div className="px-8 py-6 border-b border-[#262626] flex justify-between items-center shrink-0">
          <h3 className="font-black text-[#FFFFFF] text-xl tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-[#888888] hover:text-[#C0FF00] transition-all p-2 hover:bg-[#C0FF00]/10 rounded-full"><X size={24} /></button>
        </div>
        <div className="p-8 overflow-y-auto bg-[#1A1A1A] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-sm:max-w-xs max-w-sm p-8 animate-in zoom-in-95 duration-200 relative z-10 border border-[#262626]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#C0FF00]/10 text-[#C0FF00] rounded-[1.5rem] flex items-center justify-center mb-6"><AlertTriangle size={32} /></div>
          <h3 className="text-xl font-black text-[#FFFFFF] mb-2">{title}</h3>
          <p className="text-sm text-[#888888] leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-[#262626] text-[#FFFFFF] font-bold rounded-2xl hover:bg-[#333333] transition-all">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-6 py-4 bg-red-600/20 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // DATA STATE
  const [profile, setProfile] = useState<AdminProfile>({ churchName: "My Church", adminName: "Director" });
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [eventSongs, setEventSongs] = useState<Song[]>([]);

  // UI STATE
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState({ show: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // FORM STATE
  const [formData, setFormData] = useState<any>({});
  const [newSong, setNewSong] = useState({ title: '', key: '' });

  // AUTH & DATA FETCHING
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch Profile
          const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as AdminProfile);
          } else {
            const defaultProfile = { churchName: "My Church", adminName: currentUser.displayName || "Director" };
            await setDoc(doc(db, "profiles", currentUser.uid), defaultProfile);
            setProfile(defaultProfile);
          }

          // Fetch Data
          const qMembers = query(collection(db, "members"), where("ownerId", "==", currentUser.uid));
          const qEvents = query(collection(db, "events"), where("ownerId", "==", currentUser.uid));
          const qAssign = query(collection(db, "assignments"), where("ownerId", "==", currentUser.uid));
          const qSongs = query(collection(db, "songs"), where("ownerId", "==", currentUser.uid));

          const [mSnap, eSnap, aSnap, sSnap] = await Promise.all([
              getDocs(qMembers), getDocs(qEvents), getDocs(qAssign), getDocs(qSongs)
          ]);

          setMembers(mSnap.docs.map(d => ({ ...d.data(), id: d.id } as Member)));
          setEvents(eSnap.docs.map(d => ({ ...d.data(), id: d.id } as Event)));
          setAssignments(aSnap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment)));
          setEventSongs(sSnap.docs.map(d => ({ ...d.data(), id: d.id } as Song)));
        } catch (error) { console.error("Error fetching data:", error); }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error(e); showToast("Login failed"); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMembers([]); setEvents([]);
  };

  // --- ACTIONS ---

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
        const newEvent = { ...formData, ownerId: user.uid, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, "events"), newEvent);
        setEvents(prev => [...prev, { ...newEvent, id: docRef.id }]);
        setModalType(null);
        showToast("Event created");
    } catch (e) { showToast("Error saving event"); }
  };

  const deleteEvent = async (id: string) => {
    try { await deleteDoc(doc(db, "events", id)); setEvents(prev => prev.filter(e => e.id !== id)); } 
    catch (e) { console.error(e); }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
        if (modalType === 'add_member') {
            const initials = formData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
            const newMember = { ...formData, avatar: initials, status: formData.status || 'active', ownerId: user.uid };
            const docRef = await addDoc(collection(db, "members"), newMember);
            setMembers(prev => [...prev, { ...newMember, id: docRef.id }]);
            showToast("Member added");
        } else if (selectedMemberId) {
            await updateDoc(doc(db, "members", selectedMemberId), formData);
            setMembers(prev => prev.map(m => m.id === selectedMemberId ? { ...m, ...formData } : m));
            showToast("Member updated");
        }
        setModalType(null);
    } catch (e) { console.error(e); }
  };

  const deleteMember = async (id: string) => {
      try { await deleteDoc(doc(db, "members", id)); setMembers(prev => prev.filter(m => m.id !== id)); } 
      catch (e) { console.error(e); }
  };

  const handleAddSong = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !selectedEventId) return;
      try {
          const song = { ...newSong, eventId: selectedEventId, ownerId: user.uid, notes: '' };
          const docRef = await addDoc(collection(db, "songs"), song);
          setEventSongs(prev => [...prev, { ...song, id: docRef.id }]);
          setNewSong({ title: '', key: '' });
          showToast("Song added");
      } catch (e) { console.error(e); }
  };

  const handleUpdateSongNotes = async (songId: string, notes: string) => {
      setEventSongs(prev => prev.map(s => s.id === songId ? { ...s, notes } : s));
      try { await updateDoc(doc(db, "songs", songId), { notes }); }
      catch (e) { console.error(e); }
  };

  const deleteSong = async (id: string) => {
      try { await deleteDoc(doc(db, "songs", id)); setEventSongs(prev => prev.filter(s => s.id !== id)); } 
      catch (e) { console.error(e); }
  };

  const handleAssignMember = async (role: string, memberId: string) => {
      if (!user || !selectedEventId) return;
      const existing = assignments.find(a => a.eventId === selectedEventId && a.role === role);
      try {
          if (existing) {
              if (!memberId) {
                  await deleteDoc(doc(db, "assignments", existing.id));
                  setAssignments(prev => prev.filter(a => a.id !== existing.id));
              } else {
                  await updateDoc(doc(db, "assignments", existing.id), { memberId });
                  setAssignments(prev => prev.map(a => a.id === existing.id ? { ...a, memberId } : a));
              }
          } else if (memberId) {
              const newAssign = { eventId: selectedEventId, role, memberId, ownerId: user.uid };
              const docRef = await addDoc(collection(db, "assignments"), newAssign);
              setAssignments(prev => [...prev, { ...newAssign, id: docRef.id }]);
          }
      } catch (e) { console.error(e); }
  };

  const handleShareSchedule = (event: Event) => {
    const team = assignments.filter(a => a.eventId === event.id);
    const songs = eventSongs.filter(s => s.eventId === event.id);
    const dateStr = new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // 1. Susun Pesan
    let text = `🗓️ *WORSHIP SCHEDULE*\n*${event.name}*\n📅 ${dateStr} • ⏰ ${event.time}\n\n🎵 *SETLIST:*\n`;
    songs.forEach((s, idx) => { text += `${idx + 1}. ${s.title} (${s.key})\n`; });
    text += `\n🎸 *TEAM:*\n`;
    team.forEach(a => {
      const member = members.find(m => m.id === a.memberId);
      text += `• ${a.role}: ${member ? member.name : '-'}\n`;
    });

    // 2. Encode & Open WA Direct Link
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleShareAllSchedules = () => {
    if (events.length === 0) return showToast("No schedules");
    let text = `🗓️ *ALL WORSHIP SCHEDULES*\n============================\n\n`;
    sortedEvents.forEach(ev => {
        const team = assignments.filter(a => a.eventId === ev.id);
        const songs = eventSongs.filter(s => s.eventId === ev.id);
        text += `*${ev.name}*\n📅 ${new Date(ev.date).toLocaleDateString()} • ${ev.time}\n🎵 Setlist: ${songs.length} songs\n🎸 Team: ${team.length} assigned\n\n`;
    });
    
    // Encode & Open WA Direct Link
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events]);
  const filteredMembers = useMemo(() => searchQuery ? members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())) : [], [members, searchQuery]);
  const filteredEvents = useMemo(() => searchQuery ? events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())) : [], [events, searchQuery]);
  const adminInitials = useMemo(() => profile.adminName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2), [profile]);

  if (loading) return <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-[#C0FF00] font-black uppercase tracking-widest">CONNECTING TO CLOUD...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 selection:bg-[#C0FF00] selection:text-black">
        <div className="bg-[#1A1A1A] p-12 sm:p-16 rounded-[3rem] border border-[#262626] w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center relative overflow-hidden">
          <WorshipFlowLogo size="xl" showText={true} className="mb-14" />
          <div className="w-full space-y-8 relative z-10 text-center">
            <h2 className="text-white text-xl font-black uppercase tracking-tight">Ready to Lead Worship?</h2>
            <button onClick={handleGoogleLogin} className="w-full bg-white text-black font-black py-6 rounded-3xl transition-all flex items-center justify-center gap-4 active:scale-95 text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-[#C0FF00] hover:shadow-[0_0_30px_#C0FF00]">
               <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
               Sign in with Google
            </button>
            <p className="text-[10px] font-black text-[#333333] uppercase tracking-[0.4em]">Powered by Firebase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-[#FFFFFF] overflow-hidden selection:bg-[#C0FF00] selection:text-black">
      <Toast message={toast.message} show={toast.show} />
      <ConfirmModal isOpen={confirmState.isOpen} onClose={() => setConfirmState(p => ({...p, isOpen: false}))} onConfirm={() => { confirmState.onConfirm(); setConfirmState(p => ({...p, isOpen: false})); }} title={confirmState.title} message={confirmState.message} />

      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="bg-[#1A1A1A] w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 border border-[#262626]">
            <div className="p-6 border-b border-[#262626] flex items-center gap-4">
              <Search className="text-[#888888]" size={24} />
              <input autoFocus type="text" placeholder="Search team or events..." className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-white placeholder:text-[#333333]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {filteredMembers.length > 0 && <div><h4 className="px-4 text-[10px] text-[#888888] uppercase tracking-widest mb-3">Members</h4>{filteredMembers.map(m => <button key={m.id} onClick={() => { setActiveTab('team'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#262626] flex gap-3"><span className="text-white font-bold">{m.name}</span></button>)}</div>}
              {filteredEvents.length > 0 && <div className="mt-4"><h4 className="px-4 text-[10px] text-[#888888] uppercase tracking-widest mb-3">Events</h4>{filteredEvents.map(e => <button key={e.id} onClick={() => { setActiveTab('schedule'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#262626] flex gap-3"><span className="text-white font-bold">{e.name}</span></button>)}</div>}
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col transition-all duration-300 bg-[#1A1A1A] border-r border-[#262626] ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full xl:w-20 xl:translate-x-0 overflow-hidden'}`}>
        <div className={`px-6 py-8 flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
          <WorshipFlowLogo size="sm" collapsed={!isSidebarOpen} />
          {isSidebarOpen && <div className="overflow-hidden"><h1 className="font-black text-sm text-white uppercase truncate">{profile.churchName}</h1><p className="text-[8px] text-[#C0FF00] font-black uppercase">WORSHIP FLOW</p></div>}
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {[ { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, { id: 'schedule', icon: Calendar, label: 'Schedules' }, { id: 'team', icon: Users, label: 'Worship Team' } ].map((m: any) => (
            <button key={m.id} onClick={() => { setActiveTab(m.id as AppTab); if(window.innerWidth < 1280) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === m.id ? 'bg-[#C0FF00] text-black font-black' : 'text-[#888888] hover:bg-[#262626]'} ${!isSidebarOpen && 'justify-center'}`}>
              <m.icon size={22} /> {isSidebarOpen && <span className="text-xs uppercase tracking-widest">{m.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 mb-4">
             <button onClick={handleLogout} className="w-full bg-[#262626] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-500 transition-all">
                {isSidebarOpen ? <><LogOut size={16} /> LOGOUT</> : <LogOut size={16} />}
             </button>
        </div>
        <div className="p-4 pt-0">
          {isSidebarOpen ? (
            <div className="bg-[#262626] p-4 rounded-3xl border border-[#333333]">
               <div className="flex items-center gap-2 mb-2"><Heart size={14} className="text-[#C0FF00]" fill="currentColor" /><p className="text-[10px] font-black uppercase text-white tracking-widest">Support Us</p></div>
               <button onClick={() => setModalType('donate')} className="w-full bg-[#C0FF00] text-black py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Support</button>
            </div>
          ) : (
            <button onClick={() => setModalType('donate')} className="w-full flex justify-center p-3 text-[#C0FF00] hover:bg-[#262626] rounded-2xl transition-all"><Heart size={20} fill="currentColor" /></button>
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'xl:pl-72' : 'xl:pl-20'}`}>
        <header className="h-24 bg-[#0B0B0B] border-b border-[#262626] flex items-center justify-between px-6 xl:px-12 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-[#1A1A1A] border border-[#262626] rounded-2xl text-[#C0FF00] hover:bg-[#262626] transition-all hover:scale-110 active:scale-95 shadow-lg">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="transition-all duration-300">
              <h2 className="text-xl lg:text-2xl font-black text-[#FFFFFF] uppercase tracking-tighter">{activeTab}</h2>
              <p className="text-[10px] text-[#888888] font-bold uppercase tracking-widest hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="hidden md:flex items-center gap-3 bg-[#1A1A1A] border border-[#262626] px-4 py-2 rounded-xl text-[#888888] hover:text-[#C0FF00] transition-all">
               <Search size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Search (⌘K)</span>
            </button>
            <button onClick={() => { setFormData(profile); setModalType('edit_profile'); }} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#262626] p-2 rounded-2xl hover:border-[#C0FF00] transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-[#C0FF00] text-black flex items-center justify-center font-black text-xs">{adminInitials}</div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight">{profile.churchName}</p>
                <p className="text-[8px] font-bold text-[#888888] uppercase tracking-widest leading-none mt-1">{profile.adminName}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 xl:px-12 py-12 custom-scrollbar bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                {[
                  { val: events.length, label: 'Services', icon: Calendar },
                  { val: members.length, label: 'Worship Team', icon: Users },
                  { val: eventSongs.length, label: 'Library', icon: Music },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1A1A1A] p-10 rounded-[2rem] border border-[#262626] group hover:border-[#C0FF00]/30 transition-all shadow-xl">
                    <stat.icon className="text-[#C0FF00] mb-6 group-hover:scale-110 transition-transform" size={32} />
                    <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">{stat.val}</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <section className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Service Schedules</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest mt-1">Managed services: {events.length} / {EVENT_LIMIT}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleShareAllSchedules} className="flex-1 sm:flex-none bg-[#1A1A1A] border border-[#262626] text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] transition-all">Share All</button>
                    <button onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0], time: '09:00' }); setModalType('add_event'); }} className="flex-1 sm:flex-none bg-[#C0FF00] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest neon-glow active:scale-95 transition-all flex items-center gap-2">
                      <Plus size={18} strokeWidth={3} /> New Service
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {sortedEvents.map(ev => {
                    const eventDate = new Date(ev.date);
                    const eventAssignments = assignments.filter(a => a.eventId === ev.id);
                    const eventSongsList = eventSongs.filter(s => s.eventId === ev.id);
                    return (
                      <div key={ev.id} className="bg-[#1A1A1A] rounded-[2rem] p-8 border border-[#262626] hover:border-[#C0FF00]/50 transition-all group shadow-xl">
                        <div className="flex justify-between items-start mb-10">
                          <div className="flex gap-6">
                            <div className="bg-[#0B0B0B] border border-[#262626] px-5 py-6 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:border-[#C0FF00]/30 transition-all">
                              <span className="text-[10px] font-black text-[#C0FF00] uppercase tracking-widest mb-1">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-2xl font-black text-white">{eventDate.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-[#C0FF00] transition-colors">{ev.name}</h4>
                              <div className="flex gap-2">
                                <span className="text-[9px] font-black text-[#888888] bg-[#0B0B0B] border border-[#262626] px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-2"><Clock size={10} /> {ev.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleShareSchedule(ev)} className="p-2 text-[#888888] hover:text-[#C0FF00] transition-colors"><Share2 size={18} /></button>
                            <button onClick={() => setConfirmState({ isOpen: true, title: 'Delete Schedule?', message: 'Confirming permanent removal.', onConfirm: () => deleteEvent(ev.id) })} className="p-2 text-[#888888] hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-10">
                           <div className="bg-[#0B0B0B] p-5 rounded-2xl border border-[#262626] min-h-[140px] flex flex-col">
                             <p className="text-[9px] font-black text-[#888888] uppercase tracking-widest mb-3">Musicians</p>
                             <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar max-h-[100px]">
                               {eventAssignments.length > 0 ? (
                                 eventAssignments.map(a => {
                                   const member = members.find(m => m.id === a.memberId);
                                   return (
                                     <p key={a.id} className="text-[10px] font-bold text-white truncate flex items-center">
                                       <span className="text-[#C0FF00] mr-2 text-[6px]">●</span> {member?.name || 'Unknown'}
                                     </p>
                                   );
                                 })
                               ) : <p className="text-[10px] font-black text-[#333333] uppercase italic">Roster Empty</p>}
                             </div>
                           </div>
                           <div className="bg-[#0B0B0B] p-5 rounded-2xl border border-[#262626] min-h-[140px] flex flex-col">
                             <p className="text-[9px] font-black text-[#888888] uppercase tracking-widest mb-3">Setlist</p>
                             <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar max-h-[100px]">
                               {eventSongsList.length > 0 ? (
                                 eventSongsList.map(s => (
                                   <p key={s.id} className="text-[10px] font-bold text-white truncate flex items-center">
                                     <span className="text-[#C0FF00] mr-2 text-[6px]">●</span> {s.title}
                                   </p>
                                 ))
                               ) : <p className="text-[10px] font-black text-[#333333] uppercase italic">No Songs</p>}
                             </div>
                           </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => { setSelectedEventId(ev.id); setModalType('assign_team'); }} className="flex-1 bg-[#C0FF00] text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d4ff4d] transition-all flex items-center justify-center gap-2 shadow-lg"><UserPlus size={14} /> Team</button>
                          <button onClick={() => { setSelectedEventId(ev.id); setModalType('manage_songs'); }} className="flex-1 bg-[#262626] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#333333] transition-all flex items-center justify-center gap-2 shadow-lg"><ListMusic size={14} className="text-[#C0FF00]" /> Setlist</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'team' && (
              <section className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Worship Team</h3>
                    <p className="text-[11px] font-black text-[#888888] uppercase tracking-widest mt-1">Roster size: {members.length} / {MEMBER_LIMIT}</p>
                  </div>
                  <button onClick={() => { setFormData({ roles: [], status: 'active' }); setModalType('add_member'); }} className="bg-[#C0FF00] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest neon-glow active:scale-95 transition-all flex items-center gap-2 shadow-lg">
                    <UserPlus size={18} strokeWidth={3} /> Add Personnel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {members.map(m => (
                    <div key={m.id} className="bg-[#1A1A1A] p-8 rounded-[2rem] border border-[#262626] hover:border-[#C0FF00]/30 transition-all flex flex-col justify-between group shadow-xl">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 ${m.status === 'active' ? 'bg-[#C0FF00] text-black' : 'bg-[#262626] text-[#888888]'} rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform shadow-lg`}>{m.avatar}</div>
                          <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#C0FF00] transition-colors">{m.name}</h4>
                            <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest flex items-center gap-2"><Phone size={10} /> {m.phone}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedMemberId(m.id); setFormData(m); setModalType('edit_member'); }} className="text-[#888888] hover:text-[#C0FF00] transition-colors"><Edit3 size={18} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-8 min-h-[1.5rem]">
                        {m.roles.map(r => (
                          <span key={r} className={`text-[8px] font-black ${m.status === 'active' ? 'text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20' : 'text-[#888888] bg-[#0B0B0B] border-[#262626]'} px-3 py-1 rounded-lg uppercase tracking-widest`}>{r}</span>
                        ))}
                      </div>
                      <div className="pt-6 border-t border-[#262626] flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase flex items-center gap-2 tracking-widest ${m.status === 'active' ? 'text-[#C0FF00]' : 'text-red-500'}`}>
                             <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-[#C0FF00] shadow-[0_0_8px_#C0FF00]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} /> {m.status}
                          </span>
                          <button onClick={() => setConfirmState({ isOpen: true, title: 'Remove Member?', message: `Remove ${m.name} from roster?`, onConfirm: () => deleteMember(m.id) })} className="text-[#888888] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={
        modalType === 'add_event' ? 'New Service' : 
        modalType === 'manage_songs' ? 'Service Setlist' : 
        modalType === 'add_member' ? 'Add Personnel' :
        modalType === 'edit_member' ? 'Edit Personnel' :
        modalType === 'edit_profile' ? 'Director Settings' :
        modalType === 'assign_team' ? 'Assign Team' : 
        modalType === 'donate' ? 'Support Flow' : 'Details'
      }>
        {modalType === 'add_event' && (
          <form onSubmit={handleEventSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em]">Service Name</label>
              <input required type="text" placeholder="e.g. Christmas Eve Service" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] transition-all font-bold placeholder:text-[#333333]" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] block mb-3">Date</label>
                  <input required type="date" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] block mb-3">Time</label>
                  <input required type="time" className="w-full px-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow active:scale-95 transition-all">Publish Service</button>
          </form>
        )}

        {modalType === 'manage_songs' && (
          <div className="space-y-10">
            <div className="bg-[#0B0B0B] p-8 rounded-3xl border border-[#262626]">
              <form onSubmit={handleAddSong} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Song Title</label>
                  <input required type="text" placeholder="Title..." className="w-full px-6 py-5 bg-[#1A1A1A] text-white border border-[#262626] rounded-2xl text-sm font-bold outline-none focus:border-[#C0FF00] transition-all placeholder:text-[#333333]" value={newSong.title} onChange={e => setNewSong({...newSong, title: e.target.value})} />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Key</label>
                  <input required type="text" placeholder="Key" className="w-full px-4 py-5 bg-[#1A1A1A] text-white border border-[#262626] rounded-2xl text-sm text-center uppercase font-black outline-none focus:border-[#C0FF00] transition-all placeholder:text-[#333333]" value={newSong.key} onChange={e => setNewSong({...newSong, key: e.target.value})} />
                </div>
                <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white p-5 rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button>
              </form>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] px-4">Current Setlist ({eventSongs.filter(s => s.eventId === selectedEventId).length})</h4>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                {eventSongs.filter(s => s.eventId === selectedEventId).map((s, idx) => (
                  <div key={s.id} className="bg-[#0B0B0B] rounded-[2rem] border border-[#262626] p-8 group animate-in slide-in-from-bottom-2 duration-300 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-6">
                        <span className="text-[11px] font-black text-[#C0FF00] w-12 h-12 rounded-[1.25rem] border border-[#C0FF00]/20 flex items-center justify-center bg-[#C0FF00]/5">{idx + 1}</span>
                        <div>
                          <p className="font-black text-white text-lg uppercase tracking-tight leading-tight">{s.title}</p>
                          <p className="text-[10px] text-[#C0FF00] font-black uppercase tracking-[0.2em] mt-2">Key of {s.key}</p>
                        </div>
                      </div>
                      <button onClick={() => setConfirmState({ isOpen: true, title: 'Remove Song?', message: `Remove "${s.title}" from setlist?`, onConfirm: () => deleteSong(s.id) })} className="p-3 text-[#333333] hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
                    </div>
                    <input type="text" placeholder="Add performance notes..." className="w-full px-6 py-4 bg-[#1A1A1A] border border-[#262626] rounded-[1.5rem] text-[11px] font-medium text-[#888888] outline-none focus:border-[#C0FF00] focus:text-white placeholder:text-[#333333] transition-all" value={s.notes || ''} onChange={(e) => handleUpdateSongNotes(s.id, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(modalType === 'add_member' || modalType === 'edit_member') && (
          <form onSubmit={handleMemberSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Status</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({...formData, status: 'active'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'active' || !formData.status ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.2)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}>Active</button>
                  <button type="button" onClick={() => setFormData({...formData, status: 'inactive'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.status === 'inactive' ? 'bg-[#262626] border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}>Inactive</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Full Name</label>
                <div className="relative"><User className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} /><input required type="text" placeholder="John Doe" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Roles</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STANDARD_ROLES.map(role => (
                    <button key={role} type="button" onClick={() => {
                      const current = formData.roles || [];
                      setFormData({...formData, roles: current.includes(role) ? current.filter((r: string) => r !== role) : [...current, role]});
                    }} className={`px-2 py-3 rounded-xl text-[8px] font-black transition-all border uppercase tracking-widest ${formData.roles?.includes(role) ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.2)]' : 'bg-[#0B0B0B] border-[#262626] text-[#888888]'}`}>{role}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Contact</label>
                <div className="relative"><Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} /><input required type="text" placeholder="08..." className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow transition-all shadow-lg">Confirm Personnel</button>
          </form>
        )}

        {modalType === 'assign_team' && (
          <div className="space-y-6">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar px-1">
              {(() => {
                const assignedMemberIds = assignments.filter(a => a.eventId === selectedEventId).map(a => a.memberId);
                return STANDARD_ROLES.map(role => {
                  const currentAssignment = assignments.find(a => a.eventId === selectedEventId && a.role === role);
                  const availableMembers = members.filter(m => !assignedMemberIds.includes(m.id) || m.id === currentAssignment?.memberId);
                  return (
                    <div key={role} className="flex items-center justify-between p-6 bg-[#0B0B0B] rounded-2xl border border-[#262626] group hover:border-[#C0FF00]/20 transition-all shadow-md">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-[#888888] uppercase tracking-[0.3em] mb-1">{role}</p>
                        <p className="font-black text-white text-sm uppercase truncate tracking-tight">{currentAssignment ? members.find(m => m.id === currentAssignment.memberId)?.name : <span className="text-[#333333]">VACANT</span>}</p>
                      </div>
                      <select className="bg-[#1A1A1A] text-[#C0FF00] border border-[#262626] rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:border-[#C0FF00] cursor-pointer" value={currentAssignment?.memberId || ''} onChange={(e) => handleAssignMember(role, e.target.value)}>
                        <option value="">- SELECT -</option>
                        {availableMembers.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                  );
                });
              })()}
            </div>
            <button onClick={() => setModalType(null)} className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-lg">Save Roster</button>
          </div>
        )}

        {modalType === 'donate' && (
          <div className="text-center space-y-8 py-4">
            <div className="relative inline-block"><div className="absolute inset-0 bg-[#C0FF00] blur-xl opacity-20 animate-pulse rounded-full"></div><Heart size={48} className="text-[#C0FF00] relative z-10 mx-auto" fill="currentColor" /></div>
            <div><h4 className="text-2xl font-black text-white uppercase mb-2 tracking-tight">Support Flow</h4><p className="text-[#888888] text-sm font-medium tracking-tight">Empowering digital worship tech worldwide.</p></div>
            
            <button onClick={() => window.open('https://sociabuzz.com/ecpcorp/tribe', '_blank')} className="w-full bg-[#C0FF00] text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
               <Heart size={16} fill="black" /> Support via SociaBuzz
            </button>

            <button onClick={() => setModalType(null)} className="w-full bg-[#262626] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Done</button>
          </div>
        )}

        {modalType === 'edit_profile' && (
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            if (!user) return;
            try {
              await setDoc(doc(db, "profiles", user.uid), profile, { merge: true });
              setModalType(null); 
              showToast("Settings updated");
            } catch (err) { console.error(err); }
          }} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Church Brand</label>
                <div className="relative">
                  <Church className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                  <input required type="text" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={profile.churchName || ''} onChange={(e) => setProfile({...profile, churchName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.3em] mb-3">Admin Name</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333333]" size={18} />
                  <input required type="text" className="w-full pl-14 pr-6 py-5 bg-[#0B0B0B] border border-[#262626] rounded-2xl text-white outline-none focus:border-[#C0FF00] font-bold transition-all" value={profile.adminName || ''} onChange={(e) => setProfile({...profile, adminName: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <button type="submit" className="w-full bg-[#C0FF00] text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs neon-glow shadow-lg transition-all active:scale-95">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

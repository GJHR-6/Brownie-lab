"use client";

import { useEffect, useState } from "react";
import { X, Minus, Plus, Tag, Loader2, Award } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { validarGiftCard } from "@/actions/giftCards";
import { buscarCliente, type ClienteFidelizacion } from "@/actions/fidelizacion";
import { getProductos } from "@/actions/productos";
import type { Producto } from "@/types/database";

export default function BagDrawer({
  telefono, onClose, onContinue, onSignIn,
}: {
  telefono: string | null;
  onClose: () => void;
  onContinue: (giftCardCodigo: string | null) => void;
  onSignIn: () => void;
}) {
  const { items, updateQuantity, removeItem, addItem, total } = useCartStore();
  const [gcCode, setGcCode] = useState("");
  const [gcPreview, setGcPreview] = useState<{ codigo: string; saldo: number } | null>(null);
  const [gcError, setGcError] = useState("");
  const [gcLoading, setGcLoading] = useState(false);
  const [cliente, setCliente] = useState<ClienteFidelizacion | null>(null);
  const [sugerido, setSugerido] = useState<Producto | null>(null);

  useEffect(() => {
    if (!telefono) return;
    buscarCliente(telefono).then(r => { if (r.success) setCliente(r.data.cliente); });
  }, [telefono]);

  const clienteVisible = telefono ? cliente : null;

  useEffect(() => {
    getProductos().then(productos => {
      const idsEnBolsa = new Set(items.map(i => i.id));
      const candidato = productos
        .filter(p => p.disponible && p.stock > 0 && !idsEnBolsa.has(p.id))
        .sort((a, b) => a.precio - b.precio)[0];
      setSugerido(candidato ?? null);
    }).catch(() => setSugerido(null));
  }, [items]);

  async function handleApplyGiftCard() {
    if (!gcCode.trim()) return;
    setGcLoading(true); setGcError("");
    const result = await validarGiftCard(gcCode);
    setGcLoading(false);
    if (!result.success) { setGcError(result.error); setGcPreview(null); return; }
    setGcPreview(result.data);
  }

  const subtotal = total();
  const descuentoGc = gcPreview ? Math.min(gcPreview.saldo, subtotal) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(28,18,10,.42)", backdropFilter: "blur(2px)" }}>
      <div className="h-full w-full sm:w-[420px] flex flex-col" style={{ background: "var(--paper)" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--hairline)", background: "var(--paper-card)" }}>
          <h3 className="font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), Georgia, serif", fontSize: 19, color: "var(--ink)" }}>
            Mi bolsa
          </h3>
          <button onClick={onClose} className="border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink-soft)" }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {clienteVisible ? (
            <div className="flex items-center gap-3 mb-4" style={{ background: "var(--cream)", border: "1.5px solid var(--amber)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
              <Award size={20} style={{ color: "var(--orange-ink)", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--ink)" }}>
                Tienes <strong>{clienteVisible.compras_actuales}/10</strong> sellos. {clienteVisible.compras_actuales >= 10 ? "¡Premio disponible!" : `Faltan ${10 - clienteVisible.compras_actuales} para tu brownie gratis.`}
              </p>
            </div>
          ) : (
            <button onClick={onSignIn} className="w-full flex items-center gap-3 mb-4 text-left cursor-pointer border-0"
              style={{ background: "var(--berry)", borderRadius: "var(--r-md)", padding: "12px 14px" }}>
              <Award size={20} style={{ color: "#fff", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#fff" }}>
                <strong>Identifícate</strong> para ganar sellos con este pedido
              </p>
            </button>
          )}

          {items.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Tu bolsa está vacía.</p>}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <div className="grid place-items-center text-2xl shrink-0" style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--cream)" }}>
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: "var(--ink)", fontSize: 14.5 }}>{item.name}</p>
                <p style={{ color: "var(--orange-ink)", fontSize: 13.5, fontWeight: 700 }}>L.{item.price.toFixed(2)}</p>
              </div>
              <div className="inline-flex items-center overflow-hidden shrink-0" style={{ border: "1.5px solid var(--hairline)", borderRadius: "var(--r-pill)" }}>
                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 grid place-items-center border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink)" }}><Minus size={14} /></button>
                <span className="text-center font-bold text-sm" style={{ minWidth: 22 }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 grid place-items-center border-0 bg-transparent cursor-pointer" style={{ color: "var(--ink)" }}><Plus size={14} /></button>
              </div>
              <button onClick={() => removeItem(item.id)} className="border-0 bg-transparent cursor-pointer shrink-0" style={{ color: "var(--ink-soft)" }}><X size={15} /></button>
            </div>
          ))}

          {sugerido && (
            <div className="mb-4">
              <p className="font-semibold mb-2" style={{ color: "var(--ink)", fontSize: 13.5 }}>¿Olvidas algo?</p>
              <div className="flex items-center gap-3" style={{ background: "var(--paper-card)", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <div className="grid place-items-center text-xl shrink-0" style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--cream)" }}>
                  {sugerido.emoji ?? "🍫"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--ink)", fontSize: 13.5 }}>{sugerido.nombre}</p>
                  <p style={{ color: "var(--orange-ink)", fontSize: 13, fontWeight: 700 }}>L.{sugerido.precio.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => addItem({ id: sugerido.id, name: sugerido.nombre, price: sugerido.precio, emoji: sugerido.emoji ?? "🍫", categoria: sugerido.categoria })}
                  className="grid place-items-center cursor-pointer border-0 text-white shrink-0"
                  style={{ width: 30, height: 30, borderRadius: "var(--r-pill)", background: "var(--orange)" }}
                  aria-label={`Agregar ${sugerido.nombre}`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold mb-2" style={{ color: "var(--ink)", fontSize: 13.5 }}>¿Tienes una tarjeta de regalo?</p>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <Tag size={14} className="absolute left-3" style={{ color: "var(--ink-soft)" }} />
                  <input value={gcCode} onChange={e => setGcCode(e.target.value)} placeholder="BL-GC-XXXX-XXXX"
                    className="w-full outline-none" style={{ padding: "9px 12px 9px 30px", border: "1.5px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 13.5, background: "var(--paper-card)" }} />
                </div>
                <button onClick={handleApplyGiftCard} disabled={gcLoading} className="cursor-pointer border-0 font-semibold"
                  style={{ padding: "9px 14px", borderRadius: "var(--r-md)", background: "var(--cream)", color: "var(--orange-ink)", fontSize: 13.5 }}>
                  {gcLoading ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                </button>
              </div>
              {gcError && <p style={{ color: "var(--berry)", fontSize: 12.5, marginTop: 6 }}>{gcError}</p>}
              {gcPreview && <p style={{ color: "var(--green, #157a4d)", fontSize: 12.5, marginTop: 6 }}>Tarjeta {gcPreview.codigo} aplicada — saldo L.{gcPreview.saldo.toFixed(2)}</p>}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5" style={{ borderTop: "1px solid var(--hairline)", background: "var(--paper-card)" }}>
            <div className="flex justify-between mb-1.5" style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              <span>Subtotal</span><span>L.{subtotal.toFixed(2)}</span>
            </div>
            {descuentoGc > 0 && (
              <div className="flex justify-between mb-1.5" style={{ fontSize: 14, color: "var(--green, #157a4d)" }}>
                <span>Tarjeta de regalo</span><span>-L.{descuentoGc.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold mb-4" style={{ fontSize: 18, color: "var(--ink)" }}>
              <span>Total</span><span>L.{Math.max(0, subtotal - descuentoGc).toFixed(2)}</span>
            </div>
            <button onClick={() => onContinue(gcPreview?.codigo ?? null)}
              className="w-full font-bold cursor-pointer border-0 text-white" style={{ background: "var(--orange)", borderRadius: "var(--r-pill)", padding: "14px", fontSize: 15.5, boxShadow: "0 6px 18px rgba(217,113,30,.3)" }}>
              Ir a pagar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

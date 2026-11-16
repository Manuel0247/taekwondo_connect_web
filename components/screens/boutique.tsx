"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Package, Plus, ReceiptText, Search, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { useCancelOrder, useCreateOrder, useMyOrders, useOrder, useShopCategories, useShopProduct, useShopProducts } from "@/lib/hooks/shop";
import { MAX_QUANTITE, cartCount, cartTotal, useCartStore } from "@/lib/cart";
import { useAuthStore } from "@/lib/stores";
import { extractApiError } from "@/lib/api-error";
import { cn, storageUrl } from "@/lib/utils";
import type { Order, OrderStatut, Product } from "@/lib/types";
import { IconAction, PageContainer, PageHeader } from "@/components/layout/page";
import { Badge, Card, EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Chip, ChipRow } from "@/components/ui/controls";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/dialog";

type Accent = "primary" | "secondary";
type ScreenProps = { base: string; accent?: Accent };

export const ORDER_STATUS: Record<OrderStatut, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "#E8650A" },
  confirmee: { label: "Confirmée", color: "#3B82F6" },
  livree: { label: "Livrée", color: "#2EA55A" },
  annulee: { label: "Annulée", color: "#DC2626" },
};

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const url = storageUrl(src);
  return (
    <div className={cn("grid place-items-center overflow-hidden bg-surface-3", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <Package className="size-8 text-muted" aria-hidden="true" />
      )}
    </div>
  );
}

function CartButton({ base }: { base: string }) {
  const count = useCartStore((s) => cartCount(s.lines));
  return (
    <span className="relative">
      <IconAction href={`${base}/boutique/panier`} label={count > 0 ? `Panier (${count} article${count > 1 ? "s" : ""})` : "Panier"}>
        <ShoppingCart />
      </IconAction>
      {count > 0 && (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

function QuantityStepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-md border border-line bg-surface" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="grid size-10 place-items-center text-white disabled:opacity-30"
        aria-label="Diminuer la quantité"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-[15px] font-bold text-white" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITE}
        className="grid size-10 place-items-center text-white disabled:opacity-30"
        aria-label="Augmenter la quantité"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

// ── Catalogue ───────────────────────────────────────────────────────────────

export function ShopScreen({ base, accent = "primary" }: ScreenProps) {
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const categories = useShopCategories();
  const products = useShopProducts({ category_id: categoryId, q: debounced || undefined });
  const list = products.data ?? [];

  return (
    <>
      <PageHeader
        title="Boutique"
        subtitle="Équipements et tenues de la ligue"
        actions={
          <>
            <IconAction href={`${base}/boutique/commandes`} label="Mes commandes">
              <ReceiptText />
            </IconAction>
            <CartButton base={base} />
          </>
        }
      />
      <PageContainer className="mt-4 space-y-4 md:mt-0">
        <Input
          leftIcon={<Search className="size-[18px]" />}
          placeholder="Rechercher un produit"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un produit"
          containerClassName="md:max-w-md"
        />
        {(categories.data?.length ?? 0) > 0 && (
          <ChipRow>
            <Chip active={!categoryId} onClick={() => setCategoryId(undefined)} color={accent}>Tout</Chip>
            {categories.data!.filter((c) => (c.products_count ?? 0) > 0).map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} color={accent}>
                {c.nom}
              </Chip>
            ))}
          </ChipRow>
        )}

        {products.isLoading ? (
          <SkeletonList count={4} />
        ) : products.isError ? (
          <ErrorState onRetry={() => products.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            message={debounced || categoryId ? "Aucun produit ne correspond" : "La boutique est vide pour le moment"}
            description={debounced || categoryId ? "Essayez une autre recherche ou catégorie." : "Les produits de la ligue apparaîtront ici."}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} href={`${base}/boutique/${p.id}`} />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}

function ProductCard({ product, href }: { product: Product; href: string }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-lg bg-surface transition-transform hover:-translate-y-0.5">
      <div className="relative">
        <ProductImage src={product.images?.[0]} alt={product.nom} className={cn("aspect-square", !product.disponible && "opacity-50")} />
        {!product.disponible && (
          <Badge label="Épuisé" color="#8E8E93" size="sm" className="absolute top-2 left-2" />
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-white group-hover:text-primary-light">{product.nom}</p>
        <p className="mt-1 text-[15px] font-extrabold text-white">{fcfa(product.prix)}</p>
        {product.tailles?.length ? <p className="mt-0.5 truncate text-xs text-muted">Tailles : {product.tailles.join(", ")}</p> : null}
      </div>
    </Link>
  );
}

// ── Fiche produit ───────────────────────────────────────────────────────────

export function ProductScreen({ base, id, accent = "primary" }: ScreenProps & { id: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useShopProduct(id);
  const add = useCartStore((s) => s.add);
  const [photo, setPhoto] = useState(0);
  const [taille, setTaille] = useState<string | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [tailleError, setTailleError] = useState(false);

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !product) {
    return (
      <>
        <PageHeader title="Produit" backHref={`${base}/boutique`} />
        <ErrorState message="Produit introuvable" description="Il a peut-être été retiré de la boutique." onRetry={() => refetch()} />
      </>
    );
  }

  const images = product.images ?? [];
  const tailles = product.tailles ?? [];

  const ajouter = () => {
    if (tailles.length && !taille) {
      setTailleError(true);
      return;
    }
    add(product, tailles.length ? taille : null, quantite);
    toast.success(`${product.nom} ajouté au panier`, {
      action: { label: "Voir le panier", onClick: () => router.push(`${base}/boutique/panier`) },
    });
    setQuantite(1);
  };

  return (
    <>
      <PageHeader title={product.nom} subtitle={product.category?.nom} backHref={`${base}/boutique`} actions={<CartButton base={base} />} />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 md:grid-cols-2 md:gap-10">
        <div className="space-y-3">
          <ProductImage src={images[photo]} alt={product.nom} className="aspect-square rounded-lg" />
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-pressed={photo === i}
                  className={cn("size-16 shrink-0 overflow-hidden rounded-sm border-2", photo === i ? "border-primary" : "border-transparent opacity-70")}
                >
                  <ProductImage src={src} alt="" className="size-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-2xl font-extrabold text-white">{fcfa(product.prix)}</p>
            {!product.disponible && <Badge label="Épuisé pour le moment" color="#8E8E93" tone="soft" className="mt-2" />}
          </div>

          {tailles.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-white">Taille</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Taille">
                {tailles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={taille === t}
                    onClick={() => {
                      setTaille(t);
                      setTailleError(false);
                    }}
                    className={cn(
                      "h-10 min-w-12 rounded-sm border px-3 text-sm font-bold transition-colors",
                      taille === t
                        ? accent === "secondary" ? "border-secondary bg-secondary text-white" : "border-primary bg-primary text-white"
                        : "border-line bg-surface text-white hover:border-[#4a4a4c]",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tailleError && <p className="mt-2 text-sm text-[#f87171]" role="alert">Choisissez une taille.</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantite} onChange={(v) => setQuantite(Math.max(1, Math.min(MAX_QUANTITE, v)))} label="Quantité" />
            <Button
              onClick={ajouter}
              disabled={!product.disponible}
              variant={accent === "secondary" ? "secondary" : "primary"}
              icon={<ShoppingCart className="size-5" />}
              className="flex-1 sm:flex-none"
            >
              Ajouter au panier
            </Button>
          </div>

          {product.description && (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-white">Description</p>
              <p className="text-sm whitespace-pre-line text-muted">{product.description}</p>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}

// ── Panier ──────────────────────────────────────────────────────────────────

export function CartScreen({ base, accent = "primary" }: ScreenProps) {
  const router = useRouter();
  const { lines, setQuantite, remove, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [telephone, setTelephone] = useState(user?.telephone ?? "");
  const [commentaire, setCommentaire] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateOrder();

  const commander = () => {
    setError(null);
    create.mutate(
      {
        items: lines.map((l) => ({ product_id: l.productId, quantite: l.quantite, taille: l.taille })),
        telephone: telephone.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      },
      {
        onSuccess: (order) => {
          clear();
          toast.success(`Commande ${order.numero} envoyée`);
          router.replace(`${base}/boutique/commandes/${order.id}`);
        },
        onError: (err) => setError(extractApiError(err)),
      },
    );
  };

  return (
    <>
      <PageHeader title="Mon panier" backHref={`${base}/boutique`} size="lg" />
      <PageContainer size="lg" className="mt-4 md:mt-0">
        {lines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            message="Votre panier est vide"
            description="Ajoutez des produits depuis la boutique."
            action={<LinkButton href={`${base}/boutique`} variant={accent === "secondary" ? "secondary" : "primary"} size="sm">Voir la boutique</LinkButton>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.key}>
                  <Card className="flex gap-3">
                    <ProductImage src={l.image} alt={l.nom} className="size-20 shrink-0 rounded-sm" />
                    <div className="min-w-0 flex-1">
                      <Link href={`${base}/boutique/${l.productId}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-primary-light">
                        {l.nom}
                      </Link>
                      <p className="text-xs text-muted">
                        {l.taille ? `Taille ${l.taille} · ` : ""}
                        {fcfa(l.prix)}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QuantityStepper value={l.quantite} onChange={(v) => setQuantite(l.key, v)} label={`Quantité de ${l.nom}`} />
                        <button
                          type="button"
                          onClick={() => remove(l.key)}
                          className="grid size-10 place-items-center rounded-full text-muted hover:bg-danger/15 hover:text-[#f87171]"
                          aria-label={`Retirer ${l.nom} du panier`}
                        >
                          <Trash2 className="size-[18px]" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>

            <Card className="h-fit space-y-4 p-5 lg:sticky lg:top-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Total ({cartCount(lines)} article{cartCount(lines) > 1 ? "s" : ""})</span>
                <span className="text-xl font-extrabold text-white">{fcfa(cartTotal(lines))}</span>
              </div>
              <Input
                label="Téléphone pour vous joindre"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="07 00 00 00 00"
                maxLength={30}
              />
              <Textarea
                label="Commentaire (facultatif)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ex. à récupérer au club, couleur souhaitée…"
              />
              <p className="text-xs text-muted">
                Le paiement et la livraison se font directement avec la ligue : elle vous contactera après la commande.
              </p>
              {error && <p className="text-sm text-[#f87171]" role="alert">{error}</p>}
              <Button
                fullWidth
                loading={create.isPending}
                onClick={commander}
                variant={accent === "secondary" ? "secondary" : "primary"}
              >
                Passer la commande
              </Button>
            </Card>
          </div>
        )}
      </PageContainer>
    </>
  );
}

// ── Mes commandes ───────────────────────────────────────────────────────────

export function OrdersScreen({ base, accent = "primary" }: ScreenProps) {
  const { data, isLoading, isError, refetch } = useMyOrders();
  const list = data ?? [];

  return (
    <>
      <PageHeader title="Mes commandes" backHref={`${base}/boutique`} size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            message="Aucune commande"
            description="Vos commandes de la boutique apparaîtront ici."
            action={<LinkButton href={`${base}/boutique`} variant={accent === "secondary" ? "secondary" : "primary"} size="sm">Voir la boutique</LinkButton>}
          />
        ) : (
          <ul className="space-y-2">
            {list.map((o) => (
              <li key={o.id}>
                <OrderRow order={o} href={`${base}/boutique/commandes/${o.id}`} />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}

function OrderRow({ order, href }: { order: Order; href: string }) {
  const st = ORDER_STATUS[order.statut];
  const articles = order.items.reduce((n, i) => n + i.quantite, 0);
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-surface-2">
      <ProductImage src={order.items[0]?.image} alt="" className="size-12 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-bold text-white">{order.numero}</p>
        <p className="text-xs text-muted">
          {dateCourte(order.created_at)} · {articles} article{articles > 1 ? "s" : ""} · {fcfa(order.total)}
        </p>
      </div>
      <Badge label={st.label} color={st.color} tone="soft" size="sm" />
    </Link>
  );
}

// ── Détail d'une commande ───────────────────────────────────────────────────

export function OrderScreen({ base, id }: ScreenProps & { id: string }) {
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const cancel = useCancelOrder();
  const confirm = useConfirm();

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !order) {
    return (
      <>
        <PageHeader title="Commande" backHref={`${base}/boutique/commandes`} />
        <ErrorState onRetry={() => refetch()} />
      </>
    );
  }

  const st = ORDER_STATUS[order.statut];

  const annuler = async () => {
    const ok = await confirm({
      title: "Annuler la commande ?",
      message: `La commande ${order.numero} sera annulée et la ligue en sera prévenue.`,
      confirmLabel: "Annuler la commande",
      danger: true,
    });
    if (ok) cancel.mutate(order.id);
  };

  const etapes: { label: string; date: string | null }[] =
    order.statut === "annulee"
      ? [{ label: "Commande passée", date: order.created_at }, { label: "Annulée", date: order.annulee_le }]
      : [
          { label: "Commande passée", date: order.created_at },
          { label: "Confirmée par la ligue", date: order.confirmee_le },
          { label: "Livrée", date: order.livree_le },
        ];

  return (
    <>
      <PageHeader
        title={order.numero}
        subtitle={`Passée le ${dateHeure(order.created_at)}`}
        backHref={`${base}/boutique/commandes`}
        actions={<Badge label={st.label} color={st.color} tone="soft" />}
        size="md"
      />
      <PageContainer size="md" className="mt-4 space-y-4 md:mt-0">
        {order.statut === "en_attente" && (
          <Card className="border border-primary/30 bg-primary/10 text-sm text-white">
            Commande reçue. La ligue va vous contacter{order.telephone ? ` au ${order.telephone}` : ""} pour le paiement et la livraison.
          </Card>
        )}
        {order.statut === "annulee" && order.motif_annulation && (
          <Card className="border border-danger/30 bg-danger/10 text-sm text-white">Motif : {order.motif_annulation}</Card>
        )}

        <Card className="p-0">
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 p-4">
                <ProductImage src={it.image} alt="" className="size-14 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{it.nom_produit}</p>
                  <p className="text-xs text-muted">
                    {it.taille ? `Taille ${it.taille} · ` : ""}
                    {it.quantite} × {fcfa(it.prix_unitaire)}
                  </p>
                </div>
                <p className="text-sm font-bold whitespace-nowrap text-white">{fcfa(it.sous_total)}</p>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line p-4">
            <span className="text-sm text-muted">Total</span>
            <span className="text-lg font-extrabold text-white">{fcfa(order.total)}</span>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-white">Suivi</p>
          <ol className="space-y-3">
            {etapes.map((e) => (
              <li key={e.label} className="flex gap-3">
                <span
                  className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", e.date ? (order.statut === "annulee" && e.label === "Annulée" ? "bg-danger" : "bg-secondary-light") : "bg-line")}
                />
                <div>
                  <p className={cn("text-sm", e.date ? "font-semibold text-white" : "text-muted")}>{e.label}</p>
                  {e.date && <p className="text-xs text-muted">{dateHeure(e.date)}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {order.commentaire && (
          <Card>
            <p className="mb-1 text-sm font-semibold text-white">Votre commentaire</p>
            <p className="text-sm whitespace-pre-line text-muted">{order.commentaire}</p>
          </Card>
        )}

        {order.statut === "en_attente" && (
          <Button variant="ghost" fullWidth onClick={annuler} loading={cancel.isPending} className="text-[#f87171] hover:bg-danger/10 hover:text-[#f87171]">
            Annuler la commande
          </Button>
        )}
      </PageContainer>
    </>
  );
}

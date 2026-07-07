import { formatUsd } from "@seedance/models";

export function PriceDisplay({
  priceUsd,
  compareAtUsd,
  className,
}: {
  priceUsd: number;
  compareAtUsd?: number | null;
  className?: string;
}) {
  const showCompare =
    compareAtUsd != null && compareAtUsd > priceUsd;

  return (
    <span className={className}>
      {showCompare && (
        <>
          <span className="text-paper/40 line-through">
            {formatUsd(compareAtUsd)}
          </span>{" "}
        </>
      )}
      <span className="font-medium text-paper">{formatUsd(priceUsd)}</span>
    </span>
  );
}

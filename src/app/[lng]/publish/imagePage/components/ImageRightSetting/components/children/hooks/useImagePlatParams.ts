import { useImagePageStore } from "../../../../../useImagePageStore";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";

export function useImagePlatParams() {
  const { activePlat, platActiveAccountMap } = useImagePageStore(
    useShallow((state) => ({
      activePlat: state.activePlat,
      platActiveAccountMap: state.platActiveAccountMap,
    })),
  );

  const imageAccountItem = useMemo(() => {
    return platActiveAccountMap.get(activePlat!)!;
  }, [activePlat, platActiveAccountMap]);

  return {
    imageAccountItem,
  };
}

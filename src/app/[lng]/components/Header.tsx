import { i18n } from "i18next";
import { Trans } from "react-i18next/TransWithoutContext";

export const FooterBase = ({ i18n, lng }: { i18n: i18n; lng: string }) => {
  const t = i18n.getFixedT(lng, "footer");
  return (
    <footer>
      <Trans i18nKey="languageSwitcher" t={t}>
        {/* @ts-expect-error Trans interpolation */}
        Switch from <strong>{{ lng }}</strong> to:{" "}
      </Trans>
      <p
        style={{
          fontSize: "smaller",
          fontStyle: "italic",
          marginTop: 20,
        }}
      >
        <Trans i18nKey="helpLocize" t={t}>
          With using
          <a href="https://locize.com" target="_new">
            locize
          </a>
          you directly support the future of
          <a href="https://www.i18next.com" target="_new">
            i18next
          </a>
          .
        </Trans>
      </p>
    </footer>
  );
};

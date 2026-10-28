import { cloneElement, createContext, FormEvent, ReactElement, ReactNode, useContext, useId, useRef, useState } from "react";
import { EventGuideApiError } from "../../services/eventGuideApi";
import { CatalogErrors, catalogErrorMessage, catalogErrorPath, catalogFieldMessage } from "../../utils/tourGuideValidation";

const ErrorsContext = createContext<CatalogErrors>({});

type FormProps = {
  children: ReactNode;
  className?: string;
  validate: () => CatalogErrors;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onInvalid?: () => void;
  enabled?: boolean;
};

// Dùng chung cho các form của module; lỗi nằm trong form thay vì bị che sau modal.
export function CatalogForm({ children, className, validate, onSubmit, onInvalid, enabled = true }: FormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<CatalogErrors>({});
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const clientErrors = enabled ? validate() : {};
  const errors = { ...serverErrors, ...(submitted ? clientErrors : {}) };

  // Đợi React mở lại phần chi tiết đang ẩn rồi tập trung vào ô lỗi đầu tiên.
  function focusError(form: HTMLFormElement, fields: CatalogErrors) {
    requestAnimationFrame(() => {
      for (const field of Array.from(form.elements)) {
        if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)
            && fields[field.name] && field.getClientRects().length) {
          field.focus();
          return;
        }
      }
      summary.current?.focus();
    });
  }

  // Chặn request sai/submit lặp; chỉ hiển thị kết quả cho đúng form đang thao tác.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    setSubmitted(true);
    setServerErrors({});
    setNotice("");
    if (Object.keys(clientErrors).length) {
      onInvalid?.();
      focusError(form, clientErrors);
      return;
    }
    pending.current = true;
    try {
      await onSubmit(event);
      setSubmitted(false);
    } catch (error) {
      const fields: CatalogErrors = {};
      if (error instanceof EventGuideApiError) {
        Object.entries(error.data?.fieldErrors ?? {}).forEach(([name, message]) => {
          fields[catalogErrorPath(name)] = catalogFieldMessage(message);
        });
        if (/email/i.test(error.message) && /exist|already|đã|trùng/i.test(error.message) && form.elements.namedItem("email")) {
          fields.email = "Email này đã được sử dụng. Vui lòng chọn email khác.";
        }
      }
      setServerErrors(fields);
      const unmapped = Object.entries(fields).filter(([name]) => !form.elements.namedItem(name));
      setNotice(unmapped.length ? unmapped.map(([, message]) => message).join(" ")
        : Object.keys(fields).length ? "" : catalogErrorMessage(error));
      onInvalid?.();
      focusError(form, fields);
    } finally {
      pending.current = false;
    }
  }

  if (!enabled) return <form onSubmit={onSubmit} className={className}>{children}</form>;

  return (
    <ErrorsContext.Provider value={errors}>
      <form noValidate onSubmit={submit} className={className}
        onClickCapture={event => {
          if (event.target instanceof Element && event.target.closest("button[data-catalog-list-edit]")) setServerErrors({});
        }}
        onChangeCapture={event => {
          const target = event.target;
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
            const name = target.name;
            setServerErrors(previous => Object.fromEntries(Object.entries(previous).filter(([field]) => field !== name)));
          }
          setNotice("");
        }}>
        {notice && (
          <div ref={summary} tabIndex={-1} role="alert" className="col-span-full border border-red-300 bg-red-50 p-3 text-sm text-red-800 rounded-xs space-y-1 max-h-48 overflow-y-auto">
            <p>{notice}</p>
          </div>
        )}
        {children}
      </form>
    </ErrorsContext.Provider>
  );
}

type FieldProps = {
  name: string;
  label: string;
  enabled?: boolean;
  children: ReactElement<{ name?: string; id?: string; className?: string; "aria-describedby"?: string }>;
};

// Gắn tên trường, nhãn truy cập và lỗi cho đúng input, kể cả đường dẫn lịch trình lồng nhau.
export function CatalogField({ name, label, children, enabled = true }: FieldProps) {
  const errors = useContext(ErrorsContext);
  const id = useId();
  const error = errors[name];
  if (!enabled) return children;
  return (
    <span className={`block min-w-0 ${(children.props.className?.match(/(?:\w+:)?col-span-\S+/g) ?? []).join(" ")}`}>
      {cloneElement(children as ReactElement<Record<string, unknown>>, {
        name, id: children.props.id || id, "aria-label": label,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [children.props["aria-describedby"], error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined,
        className: `w-full ${children.props.className ?? ""}${error ? " border-red-600" : ""}`,
      })}
      {error && <span id={`${id}-error`} className="block mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}

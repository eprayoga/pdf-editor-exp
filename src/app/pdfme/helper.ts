import {
  Template,
  Font,
  checkTemplate,
  getInputFromTemplate,
  getDefaultFont,
} from "@pdfme/common";
import { Form, Viewer, Designer } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import {
  multiVariableText,
  text,
  barcodes,
  image,
  svg,
  line,
  table,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  checkbox,
  radioGroup,
} from "@pdfme/schemas";
import plugins from "./plugins";

// Ubah dari kebab-case ke PascalCase
export function fromKebabCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Fungsi untuk membaca file ttf sebagai ArrayBuffer
export const loadFontAsArrayBuffer = async (
  url: string
): Promise<ArrayBuffer> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font from ${url}`);
  return await res.arrayBuffer();
};

// Load font termasuk Tinos lokal sebagai ArrayBuffer
export const getFontsData = async (): Promise<Font> => {
  const tinosArrayBuffer = await loadFontAsArrayBuffer(
    "/assets/fonts/tinos/Tinos-Regular.ttf"
  );
  const tinosBoldArrayBuffer = await loadFontAsArrayBuffer(
    "/assets/fonts/tinos/Tinos-Bold.ttf"
  );

  return {
    ...getDefaultFont(),
    NotoSerifJP: {
      fallback: false,
      data: "https://fonts.gstatic.com/s/notoserifjp/v30/xn71YHs72GKoTvER4Gn3b5eMRtWGkp6o7MjQ2bwxOubAILO5wBCU.ttf",
    },
    NotoSansJP: {
      fallback: false,
      data: "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf",
    },
    "PinyonScript-Regular": {
      fallback: false,
      data: "https://fonts.gstatic.com/s/pinyonscript/v22/6xKpdSJbL9-e9LuoeQiDRQR8aOLQO4bhiDY.ttf",
    },
    "Tinos-Regular": {
      fallback: false,
      data: tinosArrayBuffer,
    },
    "Tinos-Bold": {
      fallback: false,
      data: tinosBoldArrayBuffer,
    },
  };
};

export const readFile = (
  file: File | null,
  type: "text" | "dataURL" | "arrayBuffer"
) => {
  return new Promise<string | ArrayBuffer>((r) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", (e) => {
      if (e && e.target && e.target.result && file !== null) {
        r(e.target.result);
      }
    });
    if (file !== null) {
      if (type === "text") {
        fileReader.readAsText(file);
      } else if (type === "dataURL") {
        fileReader.readAsDataURL(file);
      } else if (type === "arrayBuffer") {
        fileReader.readAsArrayBuffer(file);
      }
    }
  });
};

const getTemplateFromJsonFile = (file: File) => {
  return readFile(file, "text").then((jsonStr) => {
    const template: Template = JSON.parse(jsonStr as string);
    checkTemplate(template);
    return template;
  });
};

export const downloadJsonFile = (json: unknown, title: string) => {
  if (typeof window !== "undefined") {
    const blob = new Blob([JSON.stringify(json)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export const handleLoadTemplate = (
  e: React.ChangeEvent<HTMLInputElement>,
  currentRef: Designer | Form | Viewer | null
) => {
  if (e.target && e.target.files && e.target.files[0]) {
    getTemplateFromJsonFile(e.target.files[0])
      .then((t) => {
        if (!currentRef) return;
        currentRef.updateTemplate(t);
      })
      .catch((e) => {
        alert(`Invalid template file.\n--------------------------\n${e}`);
      });
  }
};

export const getPlugins = () => {
  return {
    Text: text,
    "Multi-Variable Text": multiVariableText,
    Table: table,
    Line: line,
    Rectangle: rectangle,
    Ellipse: ellipse,
    Image: image,
    SVG: svg,
    Signature: plugins.signature,
    QR: barcodes.qrcode,
    DateTime: dateTime,
    Date: date,
    Time: time,
    Select: select,
    Checkbox: checkbox,
    RadioGroup: radioGroup,
    EAN13: barcodes.ean13,
    Code128: barcodes.code128,
  };
};

export const translations: { label: string; value: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
  { value: "ar", label: "Arabic" },
  { value: "th", label: "Thai" },
  { value: "pl", label: "Polish" },
  { value: "it", label: "Italian" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
];

export const generatePDF = async (
  currentRef: Designer | Form | Viewer | null
) => {
  if (!currentRef) return;
  const template = currentRef.getTemplate();
  const options = currentRef.getOptions();
  const inputs =
    typeof (currentRef as Viewer | Form).getInputs === "function"
      ? (currentRef as Viewer | Form).getInputs()
      : getInputFromTemplate(template);
  const font = await getFontsData(); // Tunggu font dimuat

  try {
    const pdf = await generate({
      template,
      inputs,
      options: {
        font,
        lang: options.lang,
        title: "pdfme",
      },
      plugins: getPlugins(),
    });

    const blob = new Blob([new Uint8Array(pdf.buffer)], {
      type: "application/pdf",
    });
    window.open(URL.createObjectURL(blob));
  } catch (e) {
    alert(e + "\n\nCheck the console for full stack trace");
    throw e;
  }
};

export const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const getBlankTemplate = () =>
  ({
    schemas: [{}],
    basePdf: {
      width: 210,
      height: 297,
      padding: [20, 10, 20, 10],
    },
  } as Template);

export const getTemplateById = async (
  templateId: string
): Promise<Template> => {
  const template = await fetch(
    `/template-assets/${templateId}/template.json`
  ).then((res) => res.json());
  checkTemplate(template);
  return template as Template;
};

import { useEffect, useMemo, useState } from "react";
import "../../../App.css";
import {
  Card,
  Col,
  Descriptions,
  Image,
  List,
  Row,
  Space,
  Typography,
} from "antd";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const normalizeSocialUrl = (platform, value) => {
  if (typeof value !== "string" || value.trim().length === 0) return "";
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "facebook") return `https://facebook.com/${handle}`;
  if (platform === "tiktok") return `https://tiktok.com/@${handle}`;
  return "";
};

const AboutUs = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings/public`, {
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load settings");
        }
        if (mounted) {
          setSettings(data?.settings ?? null);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setSettings(null);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const view = useMemo(() => {
    const general = settings?.general ?? {};
    const appearance = settings?.appearance ?? {};
    const social = general?.social ?? {};

    const businessName =
      typeof general.businessName === "string" && general.businessName.trim()
        ? general.businessName.trim()
        : "Salon Cantik Indah";

    const description =
      typeof general.description === "string" && general.description.trim()
        ? general.description.trim()
        : "Salon Cantik Indah menyediakan layanan potong rambut, styling, perawatan wajah, manicure & pedicure, serta treatment profesional lainnya dengan tenaga ahli berpengalaman.";

    const phone =
      typeof general.phone === "string" && general.phone.trim()
        ? general.phone.trim()
        : "+62 898-5452-5596";

    const email =
      typeof general.email === "string" && general.email.trim()
        ? general.email.trim()
        : "info@saloncantikindah.com";

    const address =
      typeof general.address === "string" && general.address.trim()
        ? general.address.trim()
        : "Jl. Gubeng Kertajaya V F Blok F No.32 RT.007/RW.03, Airlangga, Kec. Gubeng, Surabaya, Jawa Timur 60286";

    const hours = Array.isArray(general.hours) ? general.hours : [];

    const instagramUrl = normalizeSocialUrl("instagram", social.instagram);
    const facebookUrl = normalizeSocialUrl("facebook", social.facebook);
    const tiktokUrl = normalizeSocialUrl("tiktok", social.tiktok);

    const logoUrl =
      typeof appearance.logoUrl === "string" && appearance.logoUrl.trim()
        ? appearance.logoUrl.trim()
        : "/src/assets/SharedAsset/logo.png";

    return {
      businessName,
      description,
      phone,
      email,
      address,
      hours,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      logoUrl,
      instagramHandle: social.instagram || "@saloncantikindah",
      facebookHandle: social.facebook || "Salon Cantik Indah",
      tiktokHandle: social.tiktok || "@saloncantikindah",
    };
  }, [settings]);

  return (
    <div style={{ paddingTop: 100, paddingLeft: 24, paddingRight: 24 }}>
      <Row gutter={[24, 24]} align="top">
        <Col xs={24} md={10} lg={8}>
          <Card>
            <Image
              src={view.logoUrl}
              alt="Foto Salon"
              style={{ width: "100%" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={14} lg={16}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card>
              <Typography.Title level={2} style={{ marginTop: 0 }}>
                {view.businessName}
              </Typography.Title>
              <Typography.Paragraph>{view.description}</Typography.Paragraph>
            </Card>

            <Card title="Kontak">
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Telepon">
                  {view.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {view.email}
                </Descriptions.Item>
                <Descriptions.Item label="WhatsApp">
                  <a
                    href={`https://wa.me/${view.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {view.phone}
                  </a>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Lokasi">
              <Typography.Paragraph style={{ marginBottom: 8 }}>
                {view.address}
              </Typography.Paragraph>
              <Typography.Text strong>Jam buka</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {view.hours.length > 0 ? (
                  <List
                    size="small"
                    dataSource={view.hours}
                    renderItem={(item, index) => (
                      <List.Item key={`${item?.day}-${index}`}>
                        {item?.day}: {item?.open} - {item?.close}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    Senin - Sabtu, 09:00 - 20:00
                  </Typography.Paragraph>
                )}
              </div>
            </Card>

            <Card title="Sosial Media">
              <Space direction="vertical" size="small">
                <Typography.Text>
                  Instagram:{" "}
                  <a
                    href={view.instagramUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {view.instagramHandle}
                  </a>
                </Typography.Text>
                <Typography.Text>
                  Facebook:{" "}
                  <a
                    href={view.facebookUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {view.facebookHandle}
                  </a>
                </Typography.Text>
                <Typography.Text>
                  TikTok:{" "}
                  <a
                    href={view.tiktokUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {view.tiktokHandle}
                  </a>
                </Typography.Text>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default AboutUs;
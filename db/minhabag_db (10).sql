-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 05/03/2026 às 14:46
-- Versão do servidor: 11.4.10-MariaDB-cll-lve-log
-- Versão do PHP: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `minhabag_db`
--

DELIMITER $$
--
-- Procedimentos
--
CREATE DEFINER=`cpses_miyly3aot5`@`localhost` PROCEDURE `ensure_store_template_clone` (IN `p_store_id` INT)   BEGIN
  DECLARE v_linked_template_id INT DEFAULT NULL;
  DECLARE v_base_template_id INT DEFAULT NULL;
  DECLARE v_new_template_id INT DEFAULT NULL;
  DECLARE v_store_subdomain VARCHAR(100);

  /* Já tem template vinculado? */
  SELECT tst.template_id
    INTO v_linked_template_id
  FROM template_store_template tst
  WHERE tst.store_id = p_store_id
  LIMIT 1;

  IF v_linked_template_id IS NOT NULL THEN
    /* Marca como inicializado e sai */
    UPDATE stores
       SET personalization_initialized = 1
     WHERE id = p_store_id;
  ELSE
    /* Descobre loja */
    SELECT subdomain
      INTO v_store_subdomain
    FROM stores
    WHERE id = p_store_id
    LIMIT 1;

    /* Base padrão (orange_default) */
    SELECT id
      INTO v_base_template_id
    FROM template_templates
    WHERE code = 'orange_default'
    LIMIT 1;

    /* Se não existir, pega qualquer ativo */
    IF v_base_template_id IS NULL THEN
      SELECT id
        INTO v_base_template_id
      FROM template_templates
      WHERE is_active = 1
      ORDER BY id ASC
      LIMIT 1;
    END IF;

    /* Cria template exclusivo da loja */
    INSERT INTO template_templates (code, name, description, is_active, created_at, updated_at)
    SELECT
      CONCAT('store_', p_store_id, '_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
      CONCAT('Template Loja ', COALESCE(v_store_subdomain, p_store_id)),
      CONCAT('Template clonado automaticamente para store_id=', p_store_id),
      1,
      NOW(),
      NOW();

    SET v_new_template_id = LAST_INSERT_ID();

    /* Clona tabelas 1:1 por template_id */
    INSERT INTO template_theme_settings
      (template_id, font_family, heading_font_family, body_font_family, font_source, brand_color, brand_color_hover, text_color, muted_text_color, bg_color, surface_color, header_bg, header_text, border_radius_base, border_radius_button, border_radius_card)
    SELECT
      v_new_template_id, font_family, heading_font_family, body_font_family, font_source, brand_color, brand_color_hover, text_color, muted_text_color, bg_color, surface_color, header_bg, header_text, border_radius_base, border_radius_button, border_radius_card
    FROM template_theme_settings WHERE template_id = v_base_template_id;

    INSERT INTO template_branding
      (template_id, logo_mode, logo_text, logo_icon, logo_image_path, logo_image_url, logo_height_px)
    SELECT
      v_new_template_id, logo_mode, logo_text, logo_icon, logo_image_path, logo_image_url, logo_height_px
    FROM template_branding WHERE template_id = v_base_template_id;

    INSERT INTO template_header_settings
      (template_id, show_search, show_cart, show_customer, cart_hover_bg, cart_hover_icon, customer_bg, customer_icon, header_variant, sticky_enabled, full_width_enabled, flush_sides_enabled, rounded_enabled, border_enabled, border_color, border_radius_px, container_max_width_px, header_padding_y_px, header_padding_x_px, top_banner_enabled, top_banner_text, top_banner_subtext, top_banner_button_text, top_banner_button_route, top_banner_bg, top_banner_text_color, top_banner_height_px)
    SELECT
      v_new_template_id, show_search, show_cart, show_customer, cart_hover_bg, cart_hover_icon, customer_bg, customer_icon, header_variant, sticky_enabled, full_width_enabled, flush_sides_enabled, rounded_enabled, border_enabled, border_color, border_radius_px, container_max_width_px, header_padding_y_px, header_padding_x_px, top_banner_enabled, top_banner_text, top_banner_subtext, top_banner_button_text, top_banner_button_route, top_banner_bg, top_banner_text_color, top_banner_height_px
    FROM template_header_settings WHERE template_id = v_base_template_id;

    INSERT INTO template_category_style
      (template_id, shape, show_border, border_color, image_fit, item_gap_px, item_size_px, title_font_size_px, title_font_weight, item_bg_color, item_radius_px, icon_size_px, section_padding_top_px, section_padding_bottom_px, justify_mode)
    SELECT
      v_new_template_id, shape, show_border, border_color, image_fit, item_gap_px, item_size_px, title_font_size_px, title_font_weight, item_bg_color, item_radius_px, icon_size_px, section_padding_top_px, section_padding_bottom_px, justify_mode
    FROM template_category_style WHERE template_id = v_base_template_id;

    INSERT INTO template_product_card_style
      (template_id, show_product_name, show_price, show_installments, show_buy_button, show_old_price, show_short_description, text_alignment, shape, show_border, border_color, image_fit, card_padding_px, card_gap_px, image_ratio, button_text, button_full_width_mobile, button_mobile_padding_px, button_mobile_margin_px, button_radius_px, mobile_button_font_size_px)
    SELECT
      v_new_template_id, show_product_name, show_price, show_installments, show_buy_button, show_old_price, show_short_description, text_alignment, shape, show_border, border_color, image_fit, card_padding_px, card_gap_px, image_ratio, button_text, button_full_width_mobile, button_mobile_padding_px, button_mobile_margin_px, button_radius_px, mobile_button_font_size_px
    FROM template_product_card_style WHERE template_id = v_base_template_id;

    INSERT INTO template_highlights_carousel
      (template_id, background_enabled, background_color, autoplay_enabled, autoplay_interval_ms, pause_on_interaction, visible_desktop, visible_mobile, scroll_step_desktop, scroll_step_mobile)
    SELECT
      v_new_template_id, background_enabled, background_color, autoplay_enabled, autoplay_interval_ms, pause_on_interaction, visible_desktop, visible_mobile, scroll_step_desktop, scroll_step_mobile
    FROM template_highlights_carousel WHERE template_id = v_base_template_id;

    INSERT INTO template_recommended_grid
      (template_id, desktop_cols, mobile_cols, gap_desktop_px, gap_mobile_px, section_padding_top_px, section_padding_bottom_px)
    SELECT
      v_new_template_id, desktop_cols, mobile_cols, gap_desktop_px, gap_mobile_px, section_padding_top_px, section_padding_bottom_px
    FROM template_recommended_grid WHERE template_id = v_base_template_id;

    INSERT INTO template_feature_block
      (template_id, badge_text, title_text, description_text, button_text, button_route, feature_image_path, feature_image_url)
    SELECT
      v_new_template_id, badge_text, title_text, description_text, button_text, button_route, feature_image_path, feature_image_url
    FROM template_feature_block WHERE template_id = v_base_template_id;

    INSERT INTO template_video_settings
      (template_id, is_enabled, source_type, youtube_embed_url, upload_video_path, strip_color, button_color, button_icon_color, autoplay_on_click_only, overlay_enabled, overlay_opacity)
    SELECT
      v_new_template_id, is_enabled, source_type, youtube_embed_url, upload_video_path, strip_color, button_color, button_icon_color, autoplay_on_click_only, overlay_enabled, overlay_opacity
    FROM template_video_settings WHERE template_id = v_base_template_id;

    /* Tabela opcional no seu dump existe */
    INSERT INTO template_product_detail_style
      (template_id, show_breadcrumb, show_rating, show_shipping_badge, show_tabs, sticky_buy_box_desktop, gallery_layout, image_fit, button_style, buy_now_button_text, add_to_cart_button_text, border_radius_px, info_gap_px, created_at, updated_at)
    SELECT
      v_new_template_id, show_breadcrumb, show_rating, show_shipping_badge, show_tabs, sticky_buy_box_desktop, gallery_layout, image_fit, button_style, buy_now_button_text, add_to_cart_button_text, border_radius_px, info_gap_px, NOW(), NOW()
    FROM template_product_detail_style WHERE template_id = v_base_template_id;

    /* Tabelas N (listas) */
    INSERT INTO template_nav_items (template_id, label, route, position, is_enabled)
    SELECT v_new_template_id, label, route, position, is_enabled
    FROM template_nav_items WHERE template_id = v_base_template_id;

    INSERT INTO template_hero_slides (template_id, badge_text, badge_bg, title_text, button_text, button_route, background_image_path, background_image_url, seconds_per_slide, is_enabled, position)
    SELECT v_new_template_id, badge_text, badge_bg, title_text, button_text, button_route, background_image_path, background_image_url, seconds_per_slide, is_enabled, position
    FROM template_hero_slides WHERE template_id = v_base_template_id;

    INSERT INTO template_sections (template_id, section_key, title_text, subtitle_text, is_enabled, position)
    SELECT v_new_template_id, section_key, title_text, subtitle_text, is_enabled, position
    FROM template_sections WHERE template_id = v_base_template_id;

    /* Vincula o template clonado à loja */
    INSERT INTO template_store_template (store_id, template_id, is_enabled, created_at, updated_at)
    VALUES (p_store_id, v_new_template_id, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      template_id = VALUES(template_id),
      is_enabled = 1,
      updated_at = NOW();

    /* Marca inicialização */
    UPDATE stores
       SET personalization_initialized = 1
     WHERE id = p_store_id;
  END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_aprovar_pedido` (IN `p_pedido_id` INT, IN `p_usuario_id` INT)   BEGIN
    UPDATE pedidos 
    SET status = 'aprovado', 
        data_aprovacao = CURRENT_TIMESTAMP 
    WHERE id = p_pedido_id;
    
    INSERT INTO logs_atividade (usuario_id, acao, descricao)
    VALUES (p_usuario_id, 'APROVAR_PEDIDO', CONCAT('Pedido #', p_pedido_id, ' aprovado'));
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_atualizar_status_atraso` ()   BEGIN
    UPDATE pedidos 
    SET status_pagamento = 'atrasado'
    WHERE status_pagamento = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_marcar_entregue` (IN `p_pedido_id` INT, IN `p_usuario_id` INT)   BEGIN
    UPDATE pedidos 
    SET status = 'entregue', 
        data_entrega = CURRENT_TIMESTAMP 
    WHERE id = p_pedido_id;
    
    INSERT INTO logs_atividade (usuario_id, acao, descricao)
    VALUES (p_usuario_id, 'MARCAR_ENTREGUE', CONCAT('Pedido #', p_pedido_id, ' entregue'));
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_marcar_pago` (IN `p_pedido_id` INT, IN `p_usuario_id` INT, IN `p_forma_pagamento` VARCHAR(50))   BEGIN
    DECLARE p_valor DECIMAL(10, 2);
    
    SELECT valor INTO p_valor FROM pedidos WHERE id = p_pedido_id;
    
    UPDATE pedidos 
    SET status_pagamento = 'pago', 
        data_pagamento = CURRENT_TIMESTAMP 
    WHERE id = p_pedido_id;
    
    INSERT INTO historico_pagamentos (pedido_id, valor, forma_pagamento)
    VALUES (p_pedido_id, p_valor, p_forma_pagamento);
    
    INSERT INTO logs_atividade (usuario_id, acao, descricao)
    VALUES (p_usuario_id, 'REGISTRAR_PAGAMENTO', CONCAT('Pagamento do pedido #', p_pedido_id, ' registrado'));
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL,
  `whatsapp` varchar(20) NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `admin_panel_settings`
--

CREATE TABLE `admin_panel_settings` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `porcentagem_rev` int(11) NOT NULL,
  `met_mes` int(11) NOT NULL,
  `met_dia` int(11) NOT NULL,
  `met_sem` int(11) NOT NULL,
  `met_ano` int(11) NOT NULL,
  `met_tri` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `admin_panel_settings`
--

INSERT INTO `admin_panel_settings` (`id`, `name`, `porcentagem_rev`, `met_mes`, `met_dia`, `met_sem`, `met_ano`, `met_tri`) VALUES
(1, 'default', 70, 500, 60, 200, 5000, 2500);

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_clicks`
--

CREATE TABLE `affiliate_clicks` (
  `id` bigint(20) NOT NULL,
  `store_id` int(11) NOT NULL,
  `affiliate_profile_id` int(11) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `session_id` varchar(120) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `landing_path` varchar(255) DEFAULT NULL,
  `referrer_url` text DEFAULT NULL,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `ip_hash` varchar(128) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_conversions`
--

CREATE TABLE `affiliate_conversions` (
  `id` bigint(20) NOT NULL,
  `store_id` int(11) NOT NULL,
  `affiliate_profile_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `click_id` bigint(20) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `conversion_status` enum('pending','approved','rejected','refunded','canceled') NOT NULL DEFAULT 'pending',
  `base_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_type` enum('fixed','percent') NOT NULL,
  `commission_rate_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_payouts`
--

CREATE TABLE `affiliate_payouts` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `affiliate_profile_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','paid','canceled') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(120) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_profiles`
--

CREATE TABLE `affiliate_profiles` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `avatar_color` varchar(20) DEFAULT '#FF6B00',
  `commission_type` enum('fixed','percent') NOT NULL DEFAULT 'percent',
  `commission_value` decimal(10,2) NOT NULL DEFAULT 10.00,
  `min_payout_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','active','inactive','blocked') NOT NULL DEFAULT 'active',
  `auto_approve_conversions` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `affiliate_profiles`
--

INSERT INTO `affiliate_profiles` (`id`, `store_id`, `customer_id`, `slug`, `avatar_color`, `commission_type`, `commission_value`, `min_payout_amount`, `status`, `auto_approve_conversions`, `notes`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 15, 8, 'wen', '#FF6B00', 'fixed', 10.00, 0.00, 'active', 1, NULL, '2026-03-03 03:48:34', '2026-03-03 00:48:34', '2026-03-03 01:30:22');

-- --------------------------------------------------------

--
-- Estrutura para tabela `api`
--

CREATE TABLE `api` (
  `id` int(11) NOT NULL,
  `asaas` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `name` varchar(100) NOT NULL,
  `slug` varchar(160) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `color_hex` varchar(20) DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'package',
  `image_path` text DEFAULT NULL,
  `use_image` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `categories`
--

INSERT INTO `categories` (`id`, `store_id`, `parent_id`, `sort_order`, `name`, `slug`, `description`, `color_hex`, `icon`, `image_path`, `use_image`, `is_active`, `created_at`) VALUES
(6, 15, NULL, 20, 'Sedas', NULL, NULL, NULL, '🧻', './uploads/categorias.jpg', 1, 1, '2026-01-18 05:34:13'),
(12, 15, 6, 21, 'Tabacos', NULL, NULL, NULL, 'leaf', './uploads/categorias.png', 0, 1, '2026-01-19 20:07:47'),
(16, 15, NULL, 11, 'Cuia', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 16:35:22'),
(17, 15, NULL, 1, 'Slick ', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 16:35:55'),
(18, 15, NULL, 9, 'Bandejas', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 16:37:27'),
(19, 15, NULL, 3, 'Balança ', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 16:38:36'),
(20, 15, NULL, 4, 'Porta Cigarro / Porta Beck', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 16:40:21'),
(21, 15, NULL, 5, 'Case ', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-20 20:57:55'),
(22, 15, NULL, 6, 'Tesouras', NULL, NULL, NULL, 'package', './uploads/categorias.png', 1, 1, '2026-01-20 21:10:56'),
(23, 15, NULL, 2, 'Piteira de papel', NULL, NULL, NULL, 'package', './uploads/categorias.png', 1, 1, '2026-01-21 03:45:08'),
(26, 15, NULL, 7, 'Isqueiro / Maçarico', NULL, NULL, NULL, 'package', './uploads/categorias.png', 1, 1, '2026-01-21 03:49:45'),
(27, 15, NULL, 8, 'Dichavador', NULL, NULL, NULL, 'package', './uploads/categorias.png', 1, 1, '2026-01-21 03:50:15'),
(31, 15, NULL, 10, 'Piteira de Vidro', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-21 22:56:24'),
(32, 15, NULL, 12, 'Seda de Vidro', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-21 22:56:54'),
(37, 15, NULL, 13, 'Shoulder Bag ', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:21:08'),
(38, 15, NULL, 14, 'bolador', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:22:50'),
(39, 15, NULL, 15, 'Acessórios Isqueiro', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:24:43'),
(40, 15, NULL, 16, 'Charutos e Acessórios', NULL, NULL, NULL, 'cigarette', './uploads/categorias.png', 0, 1, '2026-01-26 23:28:07'),
(41, 15, NULL, 17, ' Cinzeiro', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:30:12'),
(42, 15, NULL, 18, 'Blunts', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:34:06'),
(43, 15, NULL, 19, 'Filtros para Cigarro', NULL, NULL, NULL, 'package', './uploads/categorias.png', 0, 1, '2026-01-26 23:35:19'),
(44, 56, NULL, 0, 'Categoria Teste', 'categoria-teste', 'Testando', NULL, 'ShoppingBag', NULL, 0, 1, '2026-03-03 21:09:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `checkout_recommendations`
--

CREATE TABLE `checkout_recommendations` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `title_override` varchar(255) DEFAULT NULL,
  `description_override` varchar(255) DEFAULT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `discount_type` enum('none','fixed','percent') NOT NULL DEFAULT 'none',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `position` int(11) NOT NULL DEFAULT 0,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `show_only_if_cart_has_items` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `collections`
--

CREATE TABLE `collections` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `small_label` varchar(80) DEFAULT NULL,
  `title` varchar(120) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `banner_image_path` varchar(255) DEFAULT NULL,
  `featured_product_id` int(11) DEFAULT NULL,
  `featured_slogan` varchar(120) DEFAULT NULL,
  `featured_description` text DEFAULT NULL,
  `benefit_1` varchar(100) DEFAULT NULL,
  `benefit_2` varchar(100) DEFAULT NULL,
  `status` enum('draft','active','inactive','scheduled') NOT NULL DEFAULT 'draft',
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `label_small` int(11) NOT NULL,
  `benefit1` varchar(80) DEFAULT NULL,
  `benefit2` varchar(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `collections`
--

INSERT INTO `collections` (`id`, `store_id`, `small_label`, `title`, `subtitle`, `banner_image_path`, `featured_product_id`, `featured_slogan`, `featured_description`, `benefit_1`, `benefit_2`, `status`, `starts_at`, `ends_at`, `sort_order`, `is_active`, `created_at`, `updated_at`, `label_small`, `benefit1`, `benefit2`) VALUES
(1, 15, 'Oferta limitada', 'Drop de Inverno jhi', 'Até 50% off em toda a linha Nomadeddwdew', './uploads/img_69a25d526819c.jpeg', NULL, NULL, NULL, '12x sem juros', '-30% no Pix', 'active', NULL, NULL, 1, 1, '2026-02-27 03:09:17', '2026-02-28 00:13:22', 0, 'strrsrstr', 'gfyutfyuft');

-- --------------------------------------------------------

--
-- Estrutura para tabela `collection_items`
--

CREATE TABLE `collection_items` (
  `id` bigint(20) NOT NULL,
  `collection_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `collection_products`
--

CREATE TABLE `collection_products` (
  `id` int(11) NOT NULL,
  `collection_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_highlight` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `collection_products`
--

INSERT INTO `collection_products` (`id`, `collection_id`, `product_id`, `sort_order`, `is_highlight`, `is_active`, `created_at`, `updated_at`) VALUES
(18, 1, 159, 1, 0, 1, '2026-02-28 00:13:22', '2026-02-28 00:13:22'),
(19, 1, 162, 2, 0, 1, '2026-02-28 00:13:22', '2026-02-28 00:13:22'),
(20, 1, 163, 3, 0, 1, '2026-02-28 00:13:22', '2026-02-28 00:13:22'),
(21, 1, 164, 4, 0, 1, '2026-02-28 00:13:22', '2026-02-28 00:13:22');

-- --------------------------------------------------------

--
-- Estrutura para tabela `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `cpf` varchar(14) NOT NULL,
  `isAdmin` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `customers`
--

INSERT INTO `customers` (`id`, `store_id`, `name`, `email`, `password`, `phone`, `whatsapp`, `cpf`, `isAdmin`, `status`, `created_at`, `updated_at`) VALUES
(1, 15, 'wendisson santos', 'wswendissson4@gmail.com', '123', '27997457019', '27997457019', '08735538538s', 0, 'active', '2026-02-19 21:21:15', '2026-02-22 17:41:31'),
(3, 56, 'Cliente Teste', 'cliente@teste.com', '123456', '27997457019', '27997457019', '08735538533s', 1, 'active', '2026-02-22 16:06:07', '2026-03-03 20:04:09'),
(7, 60, 'wendisson santos', 'nautitechoficial@gmail.com', '$2y$10$fxqLFBeskLEWpPByaMwX9eGMSyV.yzVWsi0NUBn/Pb9nqwt1HEqiq', '27997457019', '27997457019', '08735538538', 1, 'active', '2026-02-23 05:02:41', '2026-02-23 05:02:41'),
(8, 15, 'wendisson santos santana', 'wswendisson44@gmail.com', '$2y$10$pkROR2kdFPkBlaOtXcPpUOFRY8zp4IN1zxQOOCQDAWRoRcj0qfZki', '27997457019', '27997457018', '08735538530', 1, 'active', '2026-02-23 05:11:57', '2026-03-03 14:47:21'),
(10, 63, 'wendisson santos', 'wswendisson4@gmail.com', '$2y$10$BMDPmGM5ssuyhjNX.Iuhfuecs1wmmkm6Z2q/uQq9CNv0IxrUaiJHa', '27997457019', '27997457019', '08735538538', 1, 'active', '2026-03-03 15:46:15', '2026-03-03 15:46:15'),
(14, 67, 'Gabriel Watar Yaguinuma', 'gabrielwatar@gmail.com', '$2y$10$LoaQza9wrTLfr.UClDj5aeAY7xwcwRoIicYML6Tx1NYQCUEgQsf8G', '11958101324', '11958101324', '45282310856', 1, 'active', '2026-03-03 17:59:34', '2026-03-03 17:59:34'),
(15, 68, 'Ihorhanes Pereira Carneiro', 'ihorhanest2@hotmail.com', '$2y$10$qm71GdAah0lzGigNroyD9.Rwkwz48/VXQ2kxV9ImJ4TAjNJQ5Y4Ny', '27997088267', '27997088267', '14759371729', 1, 'active', '2026-03-04 01:56:16', '2026-03-04 01:56:16'),
(16, 69, 'teste', 'gabriel@gmail.com', '$2y$10$Hm5Lk6.xnxygyXi7lhCTE.cRui1QwMV3h.Jy9VXtsJQXr/JFvcCQ.', '11958101324', '11958101324', '45282310856', 1, 'active', '2026-03-04 15:46:35', '2026-03-04 15:46:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `description` varchar(100) DEFAULT 'Padrão',
  `street` varchar(255) NOT NULL,
  `number` varchar(20) NOT NULL,
  `complement` varchar(255) DEFAULT NULL,
  `neighborhood` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` char(2) NOT NULL,
  `cep` varchar(8) NOT NULL,
  `is_main` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `description`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `cep`, `is_main`, `created_at`, `updated_at`) VALUES
(1, 1, 'Padrão', 'Rua Alvim Borges da Silva', '130', '', 'Jardim Camburi', 'Vitória', 'ES', '29090300', 0, '2026-02-19 21:21:28', '2026-02-19 21:21:28'),
(5, 7, 'PADRAO', 'alvim borges da silva', '123', 'teste', 'jd camburi', 'serra', 'es', '29090300', 1, '2026-02-23 05:02:41', '2026-02-23 05:02:41'),
(6, 8, 'PADRAO', 'alvim borges da silva', '123', 'ww', 'jardim camburi', 'serra', 'es', '290300', 1, '2026-02-23 05:11:57', '2026-02-23 05:11:57'),
(7, 10, 'PADRAO', 'alvim borges da silva', '140', 'ap', 'jardim camburi', 'Serra', 'ES', '29090300', 1, '2026-03-03 15:46:15', '2026-03-03 15:46:15'),
(11, 14, 'PADRAO', 'Rua Olympio Donda', '27', '', 'Maitinga ', 'Bertioga', 'SP', '11251510', 1, '2026-03-03 17:59:34', '2026-03-03 17:59:34'),
(12, 15, 'PADRAO', 'Pascoal Marquês ', '50', 'Casa', 'Universal ', 'Viana', 'ES', '29134523', 1, '2026-03-04 01:56:16', '2026-03-04 01:56:16'),
(13, 16, 'PADRAO', 'Rua Olympio Donda', '27', '', 'Maitinga', 'Bertioga', 'SP', '11251510', 1, '2026-03-04 15:46:35', '2026-03-04 15:46:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `featured_images`
--

CREATE TABLE `featured_images` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `image_path` text NOT NULL,
  `link_url` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `featured_images`
--

INSERT INTO `featured_images` (`id`, `store_id`, `image_path`, `link_url`, `display_order`, `active`, `created_at`) VALUES
(17, 15, './uploads/custom_696e61b9996574.95303528.png', '', 0, 1, '2026-01-28 00:15:59'),
(18, 15, './uploads/custom_696e61d1197d51.45582999.png', '', 1, 1, '2026-01-28 00:15:59');

-- --------------------------------------------------------

--
-- Estrutura para tabela `financial_transactions`
--

CREATE TABLE `financial_transactions` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('payment','refund','credit') DEFAULT 'payment',
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `marketplace_catalog`
--

CREATE TABLE `marketplace_catalog` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `logo_key` varchar(50) DEFAULT NULL,
  `status` enum('available','soon','disabled') NOT NULL DEFAULT 'available',
  `oauth_supported` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `marketplace_catalog`
--

INSERT INTO `marketplace_catalog` (`id`, `code`, `name`, `description`, `logo_key`, `status`, `oauth_supported`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'shopee', 'Shopee', 'Sincronize catálogo e pedidos automaticamente.', 'shopee', 'available', 1, 10, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45'),
(2, 'mercado_livre', 'Mercado Livre', 'Venda no maior marketplace da América Latina.', 'mercado_livre', 'available', 1, 20, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45'),
(3, 'amazon', 'Amazon', 'Alcance milhões de clientes globais.', 'amazon', 'available', 1, 30, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45'),
(4, 'magalu', 'Magalu', 'Integre com o ecossistema Magalu.', 'magalu', 'available', 1, 40, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45'),
(5, 'shein', 'Shein', 'Integração em breve.', 'shein', 'soon', 0, 50, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45'),
(6, 'aliexpress', 'AliExpress', 'Integração em breve.', 'aliexpress', 'soon', 0, 60, 1, '2026-03-02 17:35:45', '2026-03-02 17:35:45');

-- --------------------------------------------------------

--
-- Estrutura para tabela `marketplace_integrations`
--

CREATE TABLE `marketplace_integrations` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `marketplace_catalog_id` int(11) NOT NULL,
  `app_id` varchar(255) DEFAULT NULL,
  `app_secret` varchar(255) DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `token_expires_at` datetime DEFAULT NULL,
  `external_seller_id` varchar(120) DEFAULT NULL,
  `external_shop_id` varchar(120) DEFAULT NULL,
  `linked_store_name` varchar(150) DEFAULT NULL,
  `environment` enum('sandbox','production') NOT NULL DEFAULT 'production',
  `connection_status` enum('pending','authorized','connected','error','disconnected') NOT NULL DEFAULT 'pending',
  `ui_status_label` varchar(60) DEFAULT NULL,
  `sync_catalog` tinyint(1) NOT NULL DEFAULT 1,
  `sync_orders` tinyint(1) NOT NULL DEFAULT 1,
  `sync_stock` tinyint(1) NOT NULL DEFAULT 1,
  `sync_prices` tinyint(1) NOT NULL DEFAULT 0,
  `sync_frequency` varchar(20) DEFAULT '15min',
  `order_trigger` varchar(40) DEFAULT 'payment_confirmed',
  `last_check_at` datetime DEFAULT NULL,
  `price_markup_percent` decimal(10,2) DEFAULT 0.00,
  `stock_reserve_qty` int(11) NOT NULL DEFAULT 0,
  `last_sync_at` datetime DEFAULT NULL,
  `last_sync_status` enum('success','warning','error') DEFAULT NULL,
  `last_sync_message` varchar(255) DEFAULT NULL,
  `last_healthcheck_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `metadata_json` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_synced_at` datetime DEFAULT NULL,
  `last_checked_at` datetime DEFAULT NULL,
  `sync_status` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `marketplace_integrations`
--

INSERT INTO `marketplace_integrations` (`id`, `store_id`, `marketplace_catalog_id`, `app_id`, `app_secret`, `access_token`, `refresh_token`, `token_expires_at`, `external_seller_id`, `external_shop_id`, `linked_store_name`, `environment`, `connection_status`, `ui_status_label`, `sync_catalog`, `sync_orders`, `sync_stock`, `sync_prices`, `sync_frequency`, `order_trigger`, `last_check_at`, `price_markup_percent`, `stock_reserve_qty`, `last_sync_at`, `last_sync_status`, `last_sync_message`, `last_healthcheck_at`, `is_active`, `metadata_json`, `created_at`, `updated_at`, `last_synced_at`, `last_checked_at`, `sync_status`) VALUES
(1, 15, 1, 'dewdewde', 'edweddwe', NULL, NULL, NULL, NULL, NULL, 'dedwed', 'sandbox', 'connected', NULL, 1, 1, 1, 1, '15min', 'payment_confirmed', NULL, 0.00, 0, '2026-03-03 00:54:34', 'success', NULL, NULL, 1, NULL, '2026-03-02 18:33:03', '2026-03-03 03:49:41', NULL, NULL, 'idle'),
(2, 15, 2, 'gfgffyuff', 'hvjhhj', NULL, NULL, NULL, NULL, NULL, 'Minha Loja Oficial', 'production', 'connected', NULL, 1, 1, 1, 0, '15min', 'payment_confirmed', NULL, 0.00, 0, '2026-03-03 02:10:30', 'success', NULL, NULL, 1, NULL, '2026-03-03 02:10:30', '2026-03-03 03:49:41', NULL, NULL, 'idle'),
(3, 56, 2, 'crack', 'crack', NULL, NULL, NULL, NULL, NULL, 'Minha Loja Oficial', 'production', 'connected', NULL, 1, 1, 1, 1, '15min', 'payment_confirmed', NULL, 0.00, 0, '2026-03-03 02:10:53', 'success', NULL, NULL, 1, NULL, '2026-03-03 02:10:53', '2026-03-03 03:49:41', NULL, NULL, 'idle');

-- --------------------------------------------------------

--
-- Estrutura para tabela `marketplace_sync_logs`
--

CREATE TABLE `marketplace_sync_logs` (
  `id` bigint(20) NOT NULL,
  `store_id` int(11) NOT NULL,
  `marketplace_integration_id` int(11) NOT NULL,
  `event_type` enum('install','auth','sync_catalog','sync_orders','sync_stock','sync_prices','manual','disconnect','error') NOT NULL,
  `level` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `message` varchar(255) NOT NULL,
  `details_json` longtext DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `marketplace_sync_logs`
--

INSERT INTO `marketplace_sync_logs` (`id`, `store_id`, `marketplace_integration_id`, `event_type`, `level`, `message`, `details_json`, `started_at`, `finished_at`, `created_at`) VALUES
(1, 15, 1, 'auth', 'success', 'Configuração salva (Shopee)', '{\"provider\":\"shopee\",\"app_id\":\"dewdewde\",\"app_secret\":\"edweddwe\",\"sync_catalog\":true,\"sync_orders\":true,\"sync_stock\":true,\"sync_prices\":false,\"status\":\"not_installed\",\"log_message\":\"Configuração salva (Shopee)\",\"log_level\":\"success\"}', NULL, NULL, '2026-03-02 18:33:03'),
(2, 15, 1, 'auth', 'success', 'Configuração salva (Shopee)', '{\"provider\":\"shopee\",\"app_id\":\"dewdewde\",\"app_secret\":\"edweddwe\",\"linked_store_name\":\"dedwed\",\"environment\":\"production\",\"sync_catalog\":true,\"sync_orders\":true,\"sync_stock\":true,\"sync_prices\":false,\"status\":\"installed\",\"mark_synced\":true,\"last_sync_status\":\"success\",\"log_level\":\"success\",\"log_message\":\"Configuração salva (Shopee)\"}', NULL, NULL, '2026-03-03 00:54:17'),
(3, 15, 1, 'auth', 'success', 'Configuração salva (Shopee)', '{\"provider\":\"shopee\",\"app_id\":\"dewdewde\",\"app_secret\":\"edweddwe\",\"linked_store_name\":\"dedwed\",\"environment\":\"sandbox\",\"sync_catalog\":true,\"sync_orders\":true,\"sync_stock\":true,\"sync_prices\":true,\"status\":\"connected\",\"mark_synced\":true,\"last_sync_status\":\"success\",\"log_level\":\"success\",\"log_message\":\"Configuração salva (Shopee)\"}', NULL, NULL, '2026-03-03 00:54:34'),
(4, 15, 2, 'auth', 'success', 'Integração instalada (Mercado Livre)', '{\"provider\":\"mercado_livre\",\"app_id\":\"gfgffyuff\",\"app_secret\":\"hvjhhj\",\"linked_store_name\":\"Minha Loja Oficial\",\"environment\":\"production\",\"sync_catalog\":true,\"sync_orders\":true,\"sync_stock\":true,\"sync_prices\":false,\"status\":\"connected\",\"mark_synced\":true,\"last_sync_status\":\"success\",\"log_level\":\"success\",\"log_message\":\"Integração instalada (Mercado Livre)\"}', NULL, NULL, '2026-03-03 02:10:30'),
(5, 56, 3, 'auth', 'success', 'Integração instalada (Mercado Livre)', '{\"provider\":\"mercado_livre\",\"app_id\":\"crack\",\"app_secret\":\"crack\",\"linked_store_name\":\"Minha Loja Oficial\",\"environment\":\"production\",\"sync_catalog\":true,\"sync_orders\":true,\"sync_stock\":true,\"sync_prices\":true,\"status\":\"connected\",\"mark_synced\":true,\"last_sync_status\":\"success\",\"log_level\":\"success\",\"log_message\":\"Integração instalada (Mercado Livre)\"}', NULL, NULL, '2026-03-03 02:10:53');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `type` enum('low_stock','new_order','other') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notification_logs`
--

CREATE TABLE `notification_logs` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `recipient_type` enum('customer','admin') NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` enum('success','failed') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `notification_logs`
--

INSERT INTO `notification_logs` (`id`, `order_id`, `recipient_type`, `recipient_phone`, `message`, `status`, `error_message`, `sent_at`) VALUES
(1, NULL, 'customer', '5527997457019', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Luciana*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #1\n💰 *Total:* R$ 84,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 01:38:24'),
(2, NULL, 'customer', '5527996599231', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Jordan Teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #2\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:52:56'),
(3, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #2\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:52:56'),
(4, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #2\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:52:56'),
(5, NULL, 'customer', '5527996599231', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Jordan Teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #3\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:54:21'),
(6, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #3\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:54:21'),
(7, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #3\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:54:21'),
(8, NULL, 'customer', '5527996599231', '✅ *Pagamento Confirmado!*\n\nOlá *Jordan Teste*,\n\nSeu pagamento foi confirmado com sucesso! 🎉\n\n📦 *Pedido:* #3\n\nEstamos preparando seu pedido para envio.\n\nObrigado pela confiança! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:56:01'),
(9, NULL, 'customer', '5527996599231', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Jordan Teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #4\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:56:49'),
(10, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #4\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:56:49'),
(11, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #4\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:56:49'),
(12, NULL, 'customer', '5527996599231', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Jordan Teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #5\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:58:31'),
(13, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #5\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:58:31'),
(14, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #5\n👤 *Cliente:* Jordan Teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:58:31'),
(15, NULL, 'customer', '555527996599230', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Luana teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #6\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', 'UltraMsg não configurado', '2026-01-20 02:59:49'),
(16, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #6\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:59:49'),
(17, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #6\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', 'UltraMsg não configurado', '2026-01-20 02:59:49'),
(18, NULL, 'customer', '555527996599230', '❌ *Pedido Cancelado*\n\nOlá *Luana teste*,\n\nSeu pedido foi cancelado.\n\n📦 *Pedido:* #6\n\nSe tiver dúvidas, entre em contato conosco.\n\nEstamos à disposição! 💬', 'failed', 'UltraMsg não configurado', '2026-01-20 03:00:30'),
(19, NULL, 'customer', '555527996599230', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Luana teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #7\n💰 *Total:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'success', NULL, '2026-01-20 03:01:41'),
(20, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #7\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-20 03:01:42'),
(21, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #7\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 38,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-20 03:01:42'),
(22, NULL, 'customer', '555527996599230', '✅ *Pagamento Confirmado!*\n\nOlá *Luana teste*,\n\nSeu pagamento foi confirmado com sucesso! 🎉\n\n📦 *Pedido:* #7\n\nEstamos preparando seu pedido para envio.\n\nObrigado pela confiança! 🙏', 'success', NULL, '2026-01-20 03:02:46'),
(23, NULL, 'customer', '555527996599231', '🎉 *Pedido Realizado com Sucesso!*\n\nOlá *Luana teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #8\n💰 *Total:* R$ 299,90\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'success', NULL, '2026-01-20 13:57:10'),
(24, NULL, 'admin', '5527997892796', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #8\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 299,90\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-20 13:57:11'),
(25, NULL, 'admin', '5527993122515', '🔔 *Novo Pedido Recebido!*\n\n📦 *Pedido:* #8\n👤 *Cliente:* Luana teste\n💰 *Valor:* R$ 299,90\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-20 13:57:12'),
(26, NULL, 'customer', '555527996599231', '✅ *Pagamento Confirmado!*\n\nOlá *Luana teste*,\n\nSeu pagamento foi confirmado com sucesso! 🎉\n\n📦 *Pedido:* #8\n\nEstamos preparando seu pedido para envio.\n\nObrigado pela confiança! 🙏', 'success', NULL, '2026-01-20 13:57:56'),
(27, 9, 'customer', '5527996599231', '🎉 *LOJA  do ivod*\n*Pedido Realizado com Sucesso!*\n\nOlá *Conta teste*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #9\n💰 *Total:* R$ 75,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'success', NULL, '2026-01-21 04:00:32'),
(28, 9, 'admin', '5527997892796', '🔔 *LOJA  do ivod*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #9\n👤 *Cliente:* Conta teste\n💰 *Valor:* R$ 75,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-21 04:00:33'),
(29, 9, 'admin', '5527993122515', '🔔 *LOJA  do ivod*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #9\n👤 *Cliente:* Conta teste\n💰 *Valor:* R$ 75,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-21 04:00:33'),
(30, 9, 'admin', '5527997088267', '🔔 *LOJA  do ivod*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #9\n👤 *Cliente:* Conta teste\n💰 *Valor:* R$ 75,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'success', NULL, '2026-01-21 04:00:34'),
(31, 10, 'customer', '5527996599231', '🎉 *Bar do Delei*\n*Pedido Realizado com Sucesso!*\n\nOlá *Minhabagg Ecommerce*,\n\nSeu pedido foi recebido! ✅\n\n📦 *Pedido:* #10\n💰 *Total:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nVocê receberá atualizações sobre seu pedido por aqui.\n\nObrigado por comprar conosco! 🙏', 'failed', NULL, '2026-01-23 05:23:28'),
(32, 10, 'admin', '5527999791402', '🔔 *Bar do Delei*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #10\n👤 *Cliente:* Minhabagg Ecommerce\n💰 *Valor:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', NULL, '2026-01-23 05:23:28'),
(33, 10, 'admin', '5527997457019', '🔔 *Bar do Delei*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #10\n👤 *Cliente:* Minhabagg Ecommerce\n💰 *Valor:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', NULL, '2026-01-23 05:23:28'),
(34, 10, 'admin', '5524540484554', '🔔 *Bar do Delei*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #10\n👤 *Cliente:* Minhabagg Ecommerce\n💰 *Valor:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', NULL, '2026-01-23 05:23:29'),
(35, 10, 'admin', '5522558055625', '🔔 *Bar do Delei*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #10\n👤 *Cliente:* Minhabagg Ecommerce\n💰 *Valor:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', NULL, '2026-01-23 05:23:29'),
(36, 10, 'admin', '5511111111111', '🔔 *Bar do Delei*\n*Novo Pedido Recebido!*\n\n📦 *Pedido:* #10\n👤 *Cliente:* Minhabagg Ecommerce\n💰 *Valor:* R$ 26,00\n📊 *Status:* Aguardando pagamento\n\nAcesse o painel para mais detalhes.', 'failed', NULL, '2026-01-23 05:23:29'),
(37, 10, 'customer', '5527996599231', '✅ *Bar do Delei*\n*Pagamento Confirmado!*\n\nOlá *Minhabagg Ecommerce*,\n\nSeu pagamento foi confirmado com sucesso! 🎉\n\n📦 *Pedido:* #10\n\nEstamos preparando seu pedido para envio.\n\nObrigado pela confiança! 🙏', 'failed', NULL, '2026-01-23 05:24:21');

-- --------------------------------------------------------

--
-- Estrutura para tabela `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(40) DEFAULT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `customer_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `subtotal_amount` decimal(10,2) DEFAULT NULL,
  `discount_total_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','paid','canceled','refunded') DEFAULT 'pending',
  `logistics_status` varchar(40) DEFAULT 'em_separacao',
  `shipping_provider` varchar(80) DEFAULT NULL,
  `shipping_mode_selected` enum('melhor_envio','fixed','local_km') DEFAULT NULL,
  `shipping_quote_id` varchar(120) DEFAULT NULL,
  `shipping_days_estimate` int(11) DEFAULT NULL,
  `shipping_service` varchar(80) DEFAULT NULL,
  `shipping_cost` decimal(10,2) DEFAULT 0.00,
  `tracking_code` varchar(120) DEFAULT NULL,
  `tracking_url` varchar(255) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `logistics_notes` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'PIX',
  `sales_channel` varchar(40) DEFAULT 'loja',
  `marketplace_provider` varchar(50) DEFAULT NULL,
  `marketplace_order_id` varchar(120) DEFAULT NULL,
  `payment_provider` varchar(50) DEFAULT 'ASAAS',
  `asaas_payment_id` varchar(100) DEFAULT NULL,
  `payment_external_id` varchar(100) DEFAULT NULL,
  `pix_payload` text DEFAULT NULL,
  `pix_image` longtext DEFAULT NULL,
  `pix_qr_code` longtext DEFAULT NULL,
  `pix_copy_paste` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tipo` varchar(20) NOT NULL DEFAULT 'pedido',
  `subscription_id` int(11) DEFAULT NULL,
  `subscription_kind` varchar(20) DEFAULT NULL,
  `affiliate_profile_id` int(11) DEFAULT NULL,
  `affiliate_slug` varchar(120) DEFAULT NULL,
  `affiliate_commission_amount` decimal(10,2) DEFAULT NULL,
  `gateway_last_error` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `store_id`, `customer_id`, `total_amount`, `subtotal_amount`, `discount_total_amount`, `status`, `logistics_status`, `shipping_provider`, `shipping_mode_selected`, `shipping_quote_id`, `shipping_days_estimate`, `shipping_service`, `shipping_cost`, `tracking_code`, `tracking_url`, `shipped_at`, `delivered_at`, `logistics_notes`, `payment_method`, `sales_channel`, `marketplace_provider`, `marketplace_order_id`, `payment_provider`, `asaas_payment_id`, `payment_external_id`, `pix_payload`, `pix_image`, `pix_qr_code`, `pix_copy_paste`, `created_at`, `updated_at`, `tipo`, `subscription_id`, `subscription_kind`, `affiliate_profile_id`, `affiliate_slug`, `affiliate_commission_amount`, `gateway_last_error`) VALUES
(1, NULL, 15, 1, 59.90, NULL, 0.00, 'canceled', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_z7k3b0c8d5fr22fm', 'pay_z7k3b0c8d5fr22fm', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/029d7e03-9b40-4d51-916c-eb3e778444da5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630470D4', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADI0lEQVR4Xu2UwY7bQAxDffP//1E/a25u+ChNnAKFi71UAahN7JHIxz2Mdo/rh/Xr+HPyrxXyqUI+VcinCvlUIZ/qv5HroM7X6Vznq+W76KWevFG3M+Rgsub19KfzXhF81JNWzpCDyZ5aEeURIMcabmfI+aTetvGurktAyO8iLw05XGaM0rIMIb+CvPopqhlCpAgT8eEMOZfEKu/jTzlD/vVnALlr6X+0Ivhy8z4e/pu/V8ixpE3IPr1vvVofBeMIOZy0wBcfXibWkJzGOeRkEn+DhTM+68+5Ezpa05BzSVfZcAql/7j9uxByMomBO/ZCAMmmbSjWx5DjSY1uAbK7E8Dfc4l2Wg05ljSAR6BFzU4eziDnLD7kbBKqAuoBw1d28dUsAkKOJltQgBPEylNHBKeEHE+ezChS9hEG1i4F2BpyLtkmSWd/ZLpYBzoT5JAdci4ppGwdhGrQ0yW240JOJtFqWv6jdqHQPnRayMkkvUXmXPrHvdOhKJGAkGNJJpTGWMCY7NB2kRpyMinElovSgUZuS1L6EHI6qdv1TetRX030sntP6heEnEt6wvuCklSTw7Fye8Ir5GDykv1d7akzMol3NeRgskzLt7zqjOIVgSxDKSHHkoBtX/w/dlemna2nVI1DjiWxX3C3kkMxktyU7nfIuaQs3H2tA67aD129omtBamdCDiaNXe91IMGBFUPjQ3lCjiXFbN1db0Dl8WzNQsix5OLGTUjQHkj3htSYKE9JDDmWtMigxrfy/bMZjlXqFfJd80id9ZEBx4WlAUIVDVLpIceS1hi8j3bxWtoApoWGHE3KL/EQVgR+DYjqCI52hBxM7qkB414NvjuWHNSQg0n1OJf+gPF4AFJNUfUrQo4lC2RAK3sVwrutmJCTya6ysA/inaaZj3R+hRxM4j90//o4QgaSsFWsJj0LOZdEtV1qW8veQTXxjoScTOp2mXkj1FepYdAz2pDfQfrWpbASnXTo7tmJbkJ+A3nJit+mStmUortCDiZRt5N+4TN/3Ib9DDmXPChRNtfXD1Zj8zsk5FjyRxXyqUI+VcinCvlUIZ/qy8jfpdpf275W4OMAAAAASUVORK5CYII=', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADI0lEQVR4Xu2UwY7bQAxDffP//1E/a25u+ChNnAKFi71UAahN7JHIxz2Mdo/rh/Xr+HPyrxXyqUI+VcinCvlUIZ/qv5HroM7X6Vznq+W76KWevFG3M+Rgsub19KfzXhF81JNWzpCDyZ5aEeURIMcabmfI+aTetvGurktAyO8iLw05XGaM0rIMIb+CvPopqhlCpAgT8eEMOZfEKu/jTzlD/vVnALlr6X+0Ivhy8z4e/pu/V8ixpE3IPr1vvVofBeMIOZy0wBcfXibWkJzGOeRkEn+DhTM+68+5Ezpa05BzSVfZcAql/7j9uxByMomBO/ZCAMmmbSjWx5DjSY1uAbK7E8Dfc4l2Wg05ljSAR6BFzU4eziDnLD7kbBKqAuoBw1d28dUsAkKOJltQgBPEylNHBKeEHE+ezChS9hEG1i4F2BpyLtkmSWd/ZLpYBzoT5JAdci4ppGwdhGrQ0yW240JOJtFqWv6jdqHQPnRayMkkvUXmXPrHvdOhKJGAkGNJJpTGWMCY7NB2kRpyMinElovSgUZuS1L6EHI6qdv1TetRX030sntP6heEnEt6wvuCklSTw7Fye8Ir5GDykv1d7akzMol3NeRgskzLt7zqjOIVgSxDKSHHkoBtX/w/dlemna2nVI1DjiWxX3C3kkMxktyU7nfIuaQs3H2tA67aD129omtBamdCDiaNXe91IMGBFUPjQ3lCjiXFbN1db0Dl8WzNQsix5OLGTUjQHkj3htSYKE9JDDmWtMigxrfy/bMZjlXqFfJd80id9ZEBx4WlAUIVDVLpIceS1hi8j3bxWtoApoWGHE3KL/EQVgR+DYjqCI52hBxM7qkB414NvjuWHNSQg0n1OJf+gPF4AFJNUfUrQo4lC2RAK3sVwrutmJCTya6ysA/inaaZj3R+hRxM4j90//o4QgaSsFWsJj0LOZdEtV1qW8veQTXxjoScTOp2mXkj1FepYdAz2pDfQfrWpbASnXTo7tmJbkJ+A3nJit+mStmUortCDiZRt5N+4TN/3Ib9DDmXPChRNtfXD1Zj8zsk5FjyRxXyqUI+VcinCvlUIZ/qy8jfpdpf275W4OMAAAAASUVORK5CYII=', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/029d7e03-9b40-4d51-916c-eb3e778444da5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630470D4', '2026-02-15 21:47:10', '2026-02-21 18:18:31', '', NULL, NULL, NULL, NULL, NULL, NULL),
(2, NULL, 15, 1, 114.90, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_9hiisge853li8c6r', 'pay_9hiisge853li8c6r', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/98519f6f-08d0-4fe4-831b-3ad169e4ec865204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630443CF', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADGklEQVR4Xu2WS27cQBBDtdP9b5Rj9U4Zfqot20gUeBMOwBp9qll8nEX3wD6uH9av46vyr1XyqUo+VcmnKvlUJZ/qv5HrYJ3XOtmeLwk3pddjcbLHNJQMJtFRxzU9MWmKVcb4SwaTVnHZJQkLp1wUx1nyDcglxmtYKUzL6JLvQ6IVKC/PAZ8afHKWDCYvqycoju/+IT6cJaNJGjf2t4+dJf/4CSA/apHni/tNJxkcBp0KV8lY0nPfF01Lu0562v3LLxlNYtOlcqy5dAZ4vV0ls0nJULHzau8m9jgMO7hkMokJn5iJGuzG4AvQn/ymkrnkrDViZ9SKjwnzZSmZTAoTgOXSkyk8HUToRARXJWNJ7TYhNegnDvJFQQz1ksmk5/LKKUwzZtmP6JLhJEuHAB4Y1RCwNokTWTKZ5ERj6hax9J/lsSEHbclccgS84QYDTNRmJphoyVjSKrwXf9hQaMBbilrRJdNJTjiACK+jlj7TXJqWjCaF6rVwYXSHmQzVETCXjCZpxEHAhJ4Rxo6EsZRMJtHpBkLLKHA6Cwl6lMwm4ZaBfvVGFMzVDimZTS7vriyz0L7rxy2LTwLBksGkdv7Abt/OxFDDqfQNJYNJqrPTQq1xJSfDByuZTgJ00X9MgopDyJxCLplLYpu54dTk5woPHgXbx1oymdS+6zA4Ym5H8bOHFEvmkljocRiwSfyon+JKxpIXnLzdvbzadgsj8628krkkl99eymLKVnkpsWQsec3G8w1BRYvC9H/UiRzyJZNJzoh+ueRl2iCCSwaTwuSY4ew9FpC81qNkNmmCLjnhpUdmxd2SSgaTQrnXdMgKdlIh7qOgbykZTG5GkJK0FCH7xIApGUsaNH3yJJAA5MRdBkvmklNIGNBb/yKVS17K7SSUTCTXbY/ZcwRcKQch58KDeclc0k48waKBTzk+C0yYaclsEjM+fSLceTGnwQIzS74DiQ2fIwHzfevH53nJNyCx00Z44eMU3TulZDLJ6ak5i9jr+UHzta+SyaTdeMM8MDpkAdaYEXqVjCV/VCWfquRTlXyqkk9V8qnejPwNh0JoxAMgMs8AAAAASUVORK5CYII=', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADGklEQVR4Xu2WS27cQBBDtdP9b5Rj9U4Zfqot20gUeBMOwBp9qll8nEX3wD6uH9av46vyr1XyqUo+VcmnKvlUJZ/qv5HrYJ3XOtmeLwk3pddjcbLHNJQMJtFRxzU9MWmKVcb4SwaTVnHZJQkLp1wUx1nyDcglxmtYKUzL6JLvQ6IVKC/PAZ8afHKWDCYvqycoju/+IT6cJaNJGjf2t4+dJf/4CSA/apHni/tNJxkcBp0KV8lY0nPfF01Lu0562v3LLxlNYtOlcqy5dAZ4vV0ls0nJULHzau8m9jgMO7hkMokJn5iJGuzG4AvQn/ymkrnkrDViZ9SKjwnzZSmZTAoTgOXSkyk8HUToRARXJWNJ7TYhNegnDvJFQQz1ksmk5/LKKUwzZtmP6JLhJEuHAB4Y1RCwNokTWTKZ5ERj6hax9J/lsSEHbclccgS84QYDTNRmJphoyVjSKrwXf9hQaMBbilrRJdNJTjiACK+jlj7TXJqWjCaF6rVwYXSHmQzVETCXjCZpxEHAhJ4Rxo6EsZRMJtHpBkLLKHA6Cwl6lMwm4ZaBfvVGFMzVDimZTS7vriyz0L7rxy2LTwLBksGkdv7Abt/OxFDDqfQNJYNJqrPTQq1xJSfDByuZTgJ00X9MgopDyJxCLplLYpu54dTk5woPHgXbx1oymdS+6zA4Ym5H8bOHFEvmkljocRiwSfyon+JKxpIXnLzdvbzadgsj8628krkkl99eymLKVnkpsWQsec3G8w1BRYvC9H/UiRzyJZNJzoh+ueRl2iCCSwaTwuSY4ew9FpC81qNkNmmCLjnhpUdmxd2SSgaTQrnXdMgKdlIh7qOgbykZTG5GkJK0FCH7xIApGUsaNH3yJJAA5MRdBkvmklNIGNBb/yKVS17K7SSUTCTXbY/ZcwRcKQch58KDeclc0k48waKBTzk+C0yYaclsEjM+fSLceTGnwQIzS74DiQ2fIwHzfevH53nJNyCx00Z44eMU3TulZDLJ6ak5i9jr+UHzta+SyaTdeMM8MDpkAdaYEXqVjCV/VCWfquRTlXyqkk9V8qnejPwNh0JoxAMgMs8AAAAASUVORK5CYII=', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/98519f6f-08d0-4fe4-831b-3ad169e4ec865204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630443CF', '2026-02-17 23:40:31', '2026-02-21 18:18:34', '', NULL, NULL, NULL, NULL, NULL, NULL),
(3, NULL, 15, 1, 99.90, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_kzcdvx5bmmssqulo', 'pay_kzcdvx5bmmssqulo', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/7099f678-b014-4e30-bdb0-bc3b7e67a1de5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63045C7B', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADH0lEQVR4Xu2UQbLbMAxDs/P9b9RjeecGDyT925nWnb8pMwM5kUQQD1lIzuv65vjx+l351xHyaYR8GiGfRsinEfJp/DfyfDEOrZqO83iL/lZ51lTOkKtJ7bB13yG9daMjyx9yMWlVCh76lyjthFLgaT7kB5BQ+rzs1iWYLa2QH0TyT10Oqn6/rd7OkLvJy7PfZb/J9J3Q1BdnyM1knTm+vz99O0L+6VlAzjgLd9bch4rmFswIuZZU4/BbbGd7b7/kzrQn5GaS/2P71K4AorCavPjXdi/kYlI6Z47TvFUiPVWgjSH3kipU69CHmVU7t+CgQ24mJZ9cALs1o3D8LGQ7qNaQa0kVAtQVd4lVd/Tq1SVgCbmWrJM35A4fQLd6W8khN5M+60MrvWKxaPEdcDlsyN3kuIVjL9FdmO6KCbmXrBoW/G2+/XTFOcqRIZeTrajCpBACJ5vC8SEXkzr3eQrVqskXgmh3/A25mCxUTa4ElJ2DeIORMuResgtt+Eg4eZMrU7VUl9hDbibx2Whbo1oOX4fy1A+F3EtaYS14jv/yOkhfhJCLybcNs30VUErht1JqyMVkfX34Cqp+zdJ7X9+Qe0lU3u7RS6hXvbiSVIZcTdZQS07ZSJDbO2d1cMjVJO2b0gZzSzfRfMjNJCi6Q/BSwLKhVT8hc8i15DnH34weB8nk2o4RQy4nVdYxn7oAGBxhpTINhtxLdqtFLcp6K0pia2R+IeRiEvHr0jRZwpRsFjzkavLSoXMRfPhcAjvN1laVM0OuJmHx47FNfXtpOo74kLvJciNoHpdMXAPBky085GKSBu3DOy5CTy3jr+SQq0lKjFgvNvUMhJ8WPxZyMVk9w3aZOcRJdnqlhlxNGjRSsDnpWr4qVkMuJnucvNciFeA05SmZ1UrI5eTZ53vWwXcOCR1jvhNCLiaxejZ0e2oleSiNkItJn7IMmtREk8rF8GXwjSEg5AeQYsTTwW2IcnzVD7mfRPol4ezbQE+iSu1DLiaLYGWvZgOmtZnAkKvJF8MkPZsRlVJXRZUDQ24mvzVCPo2QTyPk0wj5NEI+jQ8jfwIHMQdCJsexEwAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADH0lEQVR4Xu2UQbLbMAxDs/P9b9RjeecGDyT925nWnb8pMwM5kUQQD1lIzuv65vjx+l351xHyaYR8GiGfRsinEfJp/DfyfDEOrZqO83iL/lZ51lTOkKtJ7bB13yG9daMjyx9yMWlVCh76lyjthFLgaT7kB5BQ+rzs1iWYLa2QH0TyT10Oqn6/rd7OkLvJy7PfZb/J9J3Q1BdnyM1knTm+vz99O0L+6VlAzjgLd9bch4rmFswIuZZU4/BbbGd7b7/kzrQn5GaS/2P71K4AorCavPjXdi/kYlI6Z47TvFUiPVWgjSH3kipU69CHmVU7t+CgQ24mJZ9cALs1o3D8LGQ7qNaQa0kVAtQVd4lVd/Tq1SVgCbmWrJM35A4fQLd6W8khN5M+60MrvWKxaPEdcDlsyN3kuIVjL9FdmO6KCbmXrBoW/G2+/XTFOcqRIZeTrajCpBACJ5vC8SEXkzr3eQrVqskXgmh3/A25mCxUTa4ElJ2DeIORMuResgtt+Eg4eZMrU7VUl9hDbibx2Whbo1oOX4fy1A+F3EtaYS14jv/yOkhfhJCLybcNs30VUErht1JqyMVkfX34Cqp+zdJ7X9+Qe0lU3u7RS6hXvbiSVIZcTdZQS07ZSJDbO2d1cMjVJO2b0gZzSzfRfMjNJCi6Q/BSwLKhVT8hc8i15DnH34weB8nk2o4RQy4nVdYxn7oAGBxhpTINhtxLdqtFLcp6K0pia2R+IeRiEvHr0jRZwpRsFjzkavLSoXMRfPhcAjvN1laVM0OuJmHx47FNfXtpOo74kLvJciNoHpdMXAPBky085GKSBu3DOy5CTy3jr+SQq0lKjFgvNvUMhJ8WPxZyMVk9w3aZOcRJdnqlhlxNGjRSsDnpWr4qVkMuJnucvNciFeA05SmZ1UrI5eTZ53vWwXcOCR1jvhNCLiaxejZ0e2oleSiNkItJn7IMmtREk8rF8GXwjSEg5AeQYsTTwW2IcnzVD7mfRPol4ezbQE+iSu1DLiaLYGWvZgOmtZnAkKvJF8MkPZsRlVJXRZUDQ24mvzVCPo2QTyPk0wj5NEI+jQ8jfwIHMQdCJsexEwAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/7099f678-b014-4e30-bdb0-bc3b7e67a1de5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63045C7B', '2026-02-20 00:20:45', '2026-02-21 18:18:37', '', NULL, NULL, NULL, NULL, NULL, NULL),
(7, NULL, 60, 7, 20.00, NULL, 0.00, 'pending', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_uv0jp2fsnxdilynu', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/cb719a27-cd80-4da6-9f8e-13674728f26c5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304972F', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADCUlEQVR4Xu2WQY7bUAxDvcv9b9RjeZeGj9L/ToCBi9lUAShnbH2Kj11YCXo8f1l/jk/lXyvkXYW8q5B3FfKuQt7VfyPPg3q8uocObtzpJrVuyxlyMKluDfsG9uCDuTLaH3IwWSrAy2TEzMNT2boP+R2krz7Leuyoig75PaQMl5YvNA9P3pwhJ5NPq/hwvPmb2M6Qo0n5Dr3h26ucIX+8BpCrNOK3WUO9b7diWJSrN+RYsub1R4AuB7ym3apzTMjJpCRvgd64AmpeAevUbMjZJBi0x+qt8gTQMrAN5IecTV6sZh/GLswODTmfxIpNk0Z3So3KG3IyaWdL3oeLKJJ8i3UKOZa0ue1qhejj9qWTURZ9Qg4moVqtdbBYmTA+sh0hZ5M1wWP3wUIgu3Wg40POJmENyIJHJqv7P091cB9yLOkdkCRUNiKEVowZDsxDjibx64HeCH3lgSpedMjpZM07QpZSfHXzlNvPkGPJZ0tsQY2u8FIrQu6Qo8nTX1pae1xkYFfC5zc75EQSDUqajJUBXxgD30IOJzmZx7J6PCd7sZRSQ44l7a0Ev3sfOOlZI8uAIeeSzKmHVkDzK7UjSwENOZZUe9b7390Owql2YSEnk9glCyq/OhJcmjNkKjnkWNIsuFT7ARGllB2ru5BjyRpqF5ap/nBZ27mIIUeT1Onv9zaZZ/4ZF3Is2dQi9LNMt2J1h5Mccji5X7YmWOvAiJkzEZiHHEsyZRGYvZeENfY/gSfkXNJQJXhy4rJXs1oLm0LOJl9z43J2gg64kersW8jRJCWHUTnl9RGz4y5JISeTTGzQRGYJemxorQJayMkkVqDSSbsQHeEYzUOOJQ1q6gC/cZe96+iUkKPJrkY81E1RzoW3YjTkWBI7wNnbYKvMvlUCDjJDDibxQjE1pgQEmK3YEHIyqdmp6zDLk7IsqjSOIb+D9D7wprvj/bvsq3nIbyDls1dipRnnb6WEnEwybZ673aimHdyfkJPJ/Rsst47FHt6AitMJNeRo8lcV8q5C3lXIuwp5VyHv6svIv1C5CDMgUBHfAAAAAElFTkSuQmCC', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/cb719a27-cd80-4da6-9f8e-13674728f26c5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304972F', '2026-02-23 05:02:41', '2026-02-23 05:02:47', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(8, NULL, 15, 8, 59.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_1mjwobhhcd1gzuzp', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/43fda50a-4d81-4a71-9d24-f3b911688c125204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304A39D', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADDUlEQVR4Xu2TQY7bUAxDvcv9b9RjZZeGj5SdFihcdFMFoMaxv0Q+br7meP1j/Th+n/xtlbyrkndV8q5K3lXJu/pv5POgHs/H6/1o8Hge7/N7MgJzjT0ouZocO7IEPCTZlhA77C+5mLRP+iCSxwznzymX/ALSgAfzPMjQ41fJryGtXmRq2E9nydXkNdW/szhPURTxcOg4S64mc+NSb/5mN0r+6W8BeZUU7YFWgZvH9PzYj7NKriXxHZrbEziXng3gp+ZzE0puJAeLmoDroLfC1HMWU3ItSW8cGgVWgD/ngaCSm8kXoDE8QX5liNbUySUXk2qiXTHykPOhMAUtuZbMtZs//TOHRBDo2JKbSZ8tGeYdk42kKMNqycVkLp7SKUHZAJufrIer5G4S10whsOdIgjtlkFJyM3maUVmEHAYg4dyRaxNKbiR1Rsh5nLMZzg45xpJ7ybSyY8M/H8yJ8bHkflJDme1gHfzlIdOmqCUXk1IzkF/W0Gacnp5Dyc2k/GzAWPX6KNzXrOR2MvfM0O+ZPNgR9oKVEF1yN8kd6/bnrmXVlK/d8sehlJKryfPHkCj0yeKTSTwl95KREGlkYkJ7BmRScjmpziqQQenZhpHYAx1LriZ1DiwrJrD0hwXaUUuuJjU4XPF87sdHCueS28mZva2c4ZB0DikGc8nNZDqr6gggDl54OpqSy0mZ9cQ6Ii4w3jNjIUpuJjV55Pa1EdIdlzxvAVHoJTeTGOaJPt6QTlYcYsnN5EvMsKD2Kydz/r2NApbcTL5ikGAPOGPM9pMkveRuUjIqB3sCJcceKLcl95I628MPJQZnkEvYAVxyN0n3tAWzO4fojcMGkkouJgPab4R+Ll0RdlDMSu4lp2DMy+Qgh0W9upJ7yeuGNb/OBPBLmCbOLrmZ5Ih26KL5eiXSJ4KJc0tuJhHseMiurHi0HJohUKgl95MwslwYA0b64jFY8gtIV7SnSOAMnaAIfUouJk8gIYJsADblycxL7iUP6tRBZf9IzMBWzUuuJf+pSt5VybsqeVcl76rkXX0Z+ROCa0nVYvEqMQAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/43fda50a-4d81-4a71-9d24-f3b911688c125204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304A39D', '2026-02-23 05:11:57', '2026-02-25 19:28:54', '', NULL, NULL, NULL, NULL, NULL, NULL),
(9, NULL, 15, 8, 59.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_1mjwobhhcd1gzuzp', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/43fda50a-4d81-4a71-9d24-f3b911688c125204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304A39D', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADDUlEQVR4Xu2TQY7bUAxDvcv9b9RjZZeGj5SdFihcdFMFoMaxv0Q+br7meP1j/Th+n/xtlbyrkndV8q5K3lXJu/pv5POgHs/H6/1o8Hge7/N7MgJzjT0ouZocO7IEPCTZlhA77C+5mLRP+iCSxwznzymX/ALSgAfzPMjQ41fJryGtXmRq2E9nydXkNdW/szhPURTxcOg4S64mc+NSb/5mN0r+6W8BeZUU7YFWgZvH9PzYj7NKriXxHZrbEziXng3gp+ZzE0puJAeLmoDroLfC1HMWU3ItSW8cGgVWgD/ngaCSm8kXoDE8QX5liNbUySUXk2qiXTHykPOhMAUtuZbMtZs//TOHRBDo2JKbSZ8tGeYdk42kKMNqycVkLp7SKUHZAJufrIer5G4S10whsOdIgjtlkFJyM3maUVmEHAYg4dyRaxNKbiR1Rsh5nLMZzg45xpJ7ybSyY8M/H8yJ8bHkflJDme1gHfzlIdOmqCUXk1IzkF/W0Gacnp5Dyc2k/GzAWPX6KNzXrOR2MvfM0O+ZPNgR9oKVEF1yN8kd6/bnrmXVlK/d8sehlJKryfPHkCj0yeKTSTwl95KREGlkYkJ7BmRScjmpziqQQenZhpHYAx1LriZ1DiwrJrD0hwXaUUuuJjU4XPF87sdHCueS28mZva2c4ZB0DikGc8nNZDqr6gggDl54OpqSy0mZ9cQ6Ii4w3jNjIUpuJjV55Pa1EdIdlzxvAVHoJTeTGOaJPt6QTlYcYsnN5EvMsKD2Kydz/r2NApbcTL5ikGAPOGPM9pMkveRuUjIqB3sCJcceKLcl95I628MPJQZnkEvYAVxyN0n3tAWzO4fojcMGkkouJgPab4R+Ll0RdlDMSu4lp2DMy+Qgh0W9upJ7yeuGNb/OBPBLmCbOLrmZ5Ih26KL5eiXSJ4KJc0tuJhHseMiurHi0HJohUKgl95MwslwYA0b64jFY8gtIV7SnSOAMnaAIfUouJk8gIYJsADblycxL7iUP6tRBZf9IzMBWzUuuJf+pSt5VybsqeVcl76rkXX0Z+ROCa0nVYvEqMQAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/43fda50a-4d81-4a71-9d24-f3b911688c125204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304A39D', '2026-02-23 05:11:57', '2026-02-27 05:07:44', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(10, NULL, 56, 3, 59.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_0i2g9gd9xbqdjl8s', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/1bd764a7-70e4-4968-b6cd-bddff13769235204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63043E32', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADHklEQVR4Xu2UQY4jSQwDffP/f7TP8s3bQVLpmgUWNZjLyABlO0tJMdiHzOrH+w/rn8d/ld+tkndV8q5K3lXJuyp5V3+NfD1UT3XP1/P9ovXvKF6Os+Rikk46Iz/EzEbmZIy/5GIy6hn6zLNoijh9ye8gOX9tFYE1F8AteskvImmEM/qR5jIYxV7yO8i31TgMffxDfJwlV5Nxwt58TmbJ//ksIC/14h74yH0vJjEX5VMl15KZy6Ote6mzpaVzTMnNJHWx+xJIxKdAlNdhS64mJcvACL/pMSU2t0G+kotJwfgz8ZLAwyjLdMnVZKQHZyy73d6RguBg3H6WXEuCGucpp/CA3qscoV3JteQYz/hiUpoyw5CGVHItGVsaORmnS4T93JOSy0lNWHLWdJIEuIVQ4kSWXEvK7OXFP2ZLbKSiyJyN+5JrSR00ktbDDHUYbZiildxLQiH4VWasIBJ4zI24RJfcTGrmn0xYTDjtNG+7S64mZwMIrh1uf5VrNRF4S64lde68tMLG40qGPx9PycUkxe7McvTKHEwJXkouJ18+/pdssQfJ9KJELbmc1ONn4bznSYj2ugC5CbKV3EvqDsRjr3KGGu7jQS25lnTrlZRnXnM1QDM4WMnNpLySPM4qNUUOkqfIJdeSGsExcJs4AnUVYpfRXcm1pCgds877GOFwee87csSSa8k3d0DAsDJ7keyY+ZXcTfISC7DpbBNK4/fbVuWV3Etaw448Hu3nYYRBwJJ7ySuIGOnT/YwYXoNL7iXFzaGr8ddbViyXG1JyNekNMr33c/YOPXfBS8nlpPEnx20nXnlsdtwlqeRiUuhAzB86a3weCTpXwX+p5GJSVrDRnRQvmYlwDPOSa8mArJrJC0EjbzaTUnI1OQUrDHdCuB0I4q0YLbmWxK0zxhOjrJi9ZICm2JKbSVmteaY49gQ6TAmSbSi5mGQmRlbtU5JFRZvskvtJHXguxnQ6f5d9mZf8AlInrR75nLrw5E6VXExq+swcVG4esM7hcb4lN5PcgAeITLNV4yyl/ZJYci/5R1XyrkreVcm7KnlXJe/qy8h/ARYFGCP2v4HaAAAAAElFTkSuQmCC', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/1bd764a7-70e4-4968-b6cd-bddff13769235204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63043E32', '2026-02-27 00:02:11', '2026-02-27 05:08:32', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(24, NULL, 63, 10, 139.90, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_rx2ofyua7e26p9iv', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/9bdb9010-9f62-444d-959a-5c4a4c8809cc5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630421F6', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADF0lEQVR4Xu2UQZLbQAwDddP/f5Rn6aYIDXKkpCrR1l6WrgJtj4YgGj7M2Nv5zfq1/a18tUK+Vci3CvlWId8q5Fv9GHls1H4eO/v9el77A8ntUUs7Q04mtWN4IFohRgr2ldH+kIPJVuXWxn4Y8giUuJwh55MyytRe1nvr2JAfQ7JjbK9ieNDKHvIzyNPq3j9eU+1v4naGHE2WE/b/r5UZ8h+vAeSjdMiH/p71A69MGC7K0xlyLFlzLWJ83H5A99a/+0oIOZmkPTStQd2JQ1S5fUNCjiexcPzXgBkRjxTpfRv8LSEHk2q9AtZYhgdDlumQo0kkQWy1NHqnkKBhfU3IweS1LY8WOZ1h0T3lCLqQc0k1tmz4O2r3trJXImjIuaQ0K2UtrFLNuOW2hJxNYtdclHuHCfBWBIkdGXIsiVCAqjplnSIVi+bG+5CDSfXWuBPrSnSMtzTySAs5lkS1VSOxJTiOnEqXHnI2CaFJs7JgE2bUG3tDTic5/iJqJLffWgqoCBEhx5Ka6Nz9c2ba/RJ4lQIacjCJGUVQHz2TxvwF/paQs0l8bdBQsBGP6VZIyOmkVCGeO6oUJnR9EwBDziXltGdleGeqORfTkJNJ+Zi3rpZOvFuZbizkZNItIxV+P8rlnO0POeRY8litzp0YVkRfhTuldyHHkiCbHPdJ18d5aAezJYYcTBrho8EymV/34xkXci6JpVzl3eR2qDZO5GlPyMFkCVvVjcvOww7BBYacSy4EjCh57g2GveLhQ04m+5CF1bbvQN8EhqQAhxxMXqovwSGnh9071g7kTgo5lqz9CWinm2V23CMp5GDyZOLDd1A9ARpaVwEt5GQSK2cvEeZxE7gKjnCMPCHHkgXiNoefsne1Tgk5muyCXUMtinIuvBWjIceS2AV4YXAZ9ZJPSyVIc2bIwWR5/Qbth7JgbgU45GhSM0ZY6at8IXrUQsiPILkCdTF6d+j8XfbVPOR8UsftqYiVZpzPSgk5mWSKz2ixe6s1ltPvkJPJjVqOe68IZUnj02LIweS3KuRbhXyrkG8V8q1CvtWHkb8BoIB4tOWt+8IAAAAASUVORK5CYII=', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/9bdb9010-9f62-444d-959a-5c4a4c8809cc5204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***630421F6', '2026-03-03 15:46:15', '2026-03-03 15:46:55', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(30, NULL, 67, 14, 5.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_j8k1s64ko5imbyoe', 'pay_j8k1s64ko5imbyoe', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/d1a2639d-0b8d-40a5-9737-8d01ab083d855204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042289', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADB0lEQVR4Xu2VwY4bMQxD55b//6N+1tzS8InyzC6wcLGXagA6G1um+JiDhfZ4/3L9Ob4r/7pC7lbI3Qq5WyF3K+Ru/TfyPFgvytfJyfH5fnoquX+2yxlyLqkKXX9VO680zM5of8jBZKsC+doIS1e2rkM+g5RRnvayX6XiQj6IVNUencpZadpCPoR8t2rTV38TlzPkaFK+Qy+8/dgZ8sfPAHItPbwNKpwJg373hhxLui97w3VvxaWqigk5mSxJZ1Fc6uuQVsyGnE2KZRikqssELFNJPQ3+lZCzSUT1GAan3JmaBOiQo0m1MYDc0TLTdU9uzpBzSdwN4LxEAkFw8isqQ44l0TDoU21HUaqrjE4EDTmYxIFQLUjuptuvHwg5nFTPoJh1B3YpgtSODDmYLBzJHmVUjP6pLosvVYccSxbVkvwwTS2Gy+mYkGPJZQBSdUqQ51AeOZRFh5xNvjUJbGiqsJxgPSW3bsjRpBtVdesOL/VyhpxMyiKjpPbUIgO7EkoBDTmXRHeCGn56lMZIqC3kdFICbRrURrp9LMVqyMFk3fAffmpliNC9blYKDDmXbATohppqri10Q04mkc4ywiqL+QBCdp9LyPHkx6XThKKQvFZ25YWcTPZrA/rhteOppu3oVYUcSxr70vIXV4FXLmLI0WTDlMtUPKHf40KOJau3+hDcSKVwqM7KCzmY9P+zBzxTUDB2jkIEGww5lywdAJeXZwCsknHAhxxNqodjdU7nrLRbg3vIueSpl5ZB/mr227fke20hR5Nyqs9eTnnxlLnibkkhB5NvOgcPDFMlygWtUUALOZlcVjVt91gU0REVIybkWLJAuWwuP8uNaxkMOZfs5Yd20+OwxkQNlNskhJxI+qFf8vCtBH100eYEaZUZcjCpyvs6ZSbTs0ACMmfIyaR67DURXfnS02BBOSGfQX722yioqncvpajqh3wCWU9t/pSGTTjflRJyMklXCMCHRpS+aI71F3IyyQT0CCw3sg5daSvRwSHnkr9aIXcr5G6F3K2QuxVytx5G/gWUkdhUHUHmhwAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/d1a2639d-0b8d-40a5-9737-8d01ab083d855204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042289', '2026-03-03 17:59:34', '2026-03-03 18:00:08', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(35, NULL, 67, 14, 5.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 18:29:39', '2026-03-03 18:35:45', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(36, NULL, 67, 14, 139.90, NULL, 0.00, 'pending', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_ryr1m1prnl7w44cu', 'pay_ryr1m1prnl7w44cu', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/e5d04595-402f-40c0-9db8-d4e7bcc1dc705204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304C154', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADG0lEQVR4Xu2Ty44bQQwDfZv//6N81twcs0iNdwMEE+wlMkD5Md1SFX3o9uP5w/r1+LPzr1XzrmreVc27qnlXNe/qv5nngzrOQ2seT9aHJ69OekPWXG1qRV8M6BCnMU0mO3zNxaaAE03DUzRPw3h+hKz5GebT5Qi/DzL09lfNjzGfvgOXmRr3G1lzs5muXrCk5DN/8Gvv75p7TdGZ3rxC1vzra4F51Rz8oX84Jw/0Wk3zXTXXmnAPvnzah1kfem4AH22+36GaC03N5pS5AMZyB8g5FA8JUXOx+fUq+LivpiOInouQH6m51jzjIdoc5IsDE6LmZpOiz0QR4iwn4W1HrbnXPLVEtgbPAo6x3cTW3GyCivKIRcgL9Pycac3FJhjcS/RbLXGIdnCpmstNaD725STEX9nxC0msudicNpIGltAmzKnQcmquNc/cAJpmtNCp2yQoDM+am83Q9kjSXrpWk+F4P2puNk+Y9OKg89TbGTHVrbnZ9IYhusF5KY98/waLmqvNq5hgvXvOIm62NTebuJxzQhidvhwETaJ/peZuk7lOf26AUHegJi5zpdRcbDI7nOCtFG6CkxQVQzcCquZmM4QRxaSj72szRM3dptqHpj57Lznv3AZEdfQmuOZuU4SHWvBUkMM0gE4LquZeMydvZJh0T06e6cQJqLnXDCdSu7enldLGlJPomqvNC/W14DsPOSp2bGruNnXA0mVH8pRErKtlrOZqU6ProD3IciYeQuaHai42X21Dtt7LxEly65wrUXOtaRVBBHu1eSpTsZM2s5p7TXiUi4k+sHmSNK+52tTIbBK8REqOw7G8rbnYjPZQBYT8EncyAam53WQHE1hiVLYQbiW65lpzRJ/yyaFnL+Z7J72ae80pzbkFhsT64wvhW5Jdzb2mMEi1r9MW6azstKZXc7nJUl2eghUhnjg67pJcc7vJQGYcZYhB5M0yt4RfqLnexBHy1mjQ0hPGYs1PMOlldspETtMJitCj5mJzZkdCJNlAtmUlYs3F5oO65gqgPYnkONlkzc3mj6rmXdW8q5p3VfOuat7Vh5m/Aa6JGgVAL8P/AAAAAElFTkSuQmCC', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/e5d04595-402f-40c0-9db8-d4e7bcc1dc705204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304C154', '2026-03-03 18:51:37', '2026-03-03 18:51:38', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(40, NULL, 67, 14, 5.00, NULL, 0.00, 'paid', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 18:52:59', '2026-03-03 19:46:46', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(41, NULL, 68, 15, 59.90, NULL, 0.00, 'pending', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_z95jhscmmigzvadz', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/45bb0a5a-d9d3-464e-aac6-0e03f51fb5e35204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304CEF8', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADCElEQVR4Xu2UwW7kMAxDc8v//9F+Vm7d8FGyBwWKLHpZBaAnY0sUH3uIp8fXL9ef47vyryvk0wr5tEI+rZBPK+TT+m/kdbBOCdd5nffG8Lqle2bF23aGnEsu5lo2CL62r4z2hxxMtrrYxtBVytZ1yHeQMnpgL/supYd8EUkhVaOOYVfrQcg3kF9LVWNo+9dsOUOOJst5PX9WZsgfPgPItTTSww3Q+8YJo5lvRa2QY8maa/v0s6vrUpVjQs4mZTh1tF09mqhyX4sNOZs0pKE4t9Y5ARTpaKshx5K067RNPFGLUTTJ/I2Qc0nPrGmMA3SXjvv4MyHHkmqNYIDtr1I1W7buQo4lwbBWU3SXtyjBDHrI0WT9rncIJIai28/POuR00sYyqz5kpq/SycTaFXIu6bpge0hQdXFJHOnGdcixJJTAZYJpajE0OEMOJ2t8bmSdJVKaDjmbLBFvB3j5ty7URU1DziY1UkCdjFQ2s9SKUEDIyeTpd2/GnroLTvSnFNCQc8l79M1CgBTSyNLYW8jp5EIk216axtyLpZQaciyJ++RoXXFSDqVUt2+L5iHnkqB49tFKp9BaAQ05l6wrgJ1HYx2+Ijg9LyzkZNJGA0XolQu0izG5Ww45l3R7rXdub0lchZ3SVcixpLt7q19uG3cUH9+VFkOOJa1r5J/vNpnvxP6GnE16eo+bcAQTftne4WQIOZyUlUkNP8N8GLEFMORgEhSfKS83DtMUWCJoyLmk3i6vXHMmeqq9FOkcUoBDDiY3ptpDY7iRqvcWcjRpb90AO+XFY7PjPpJCTiaZtAXGAkBD6yqghZxMYipEj8eSi7C9Y8SEHEsaLCttESrwVtMpIUeTvbgA7dbTirzirRgNOZaUm3fcFwDstqJYdoI0YkNOJlWxe0onnkwzCrJShpCDSRMXJirfjWoQWrMv5BtIXnhdjH7nvH8v+2oecj6p81CAhyiuBCyIFXIwWb7C7gNR+qI51hNyMvn5P5hHCptvQIcqUe6Qo8lfrZBPK+TTCvm0Qj6tkE/rZeRfQhLIZGETOuwAAAAASUVORK5CYII=', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/45bb0a5a-d9d3-464e-aac6-0e03f51fb5e35204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304CEF8', '2026-03-04 01:56:16', '2026-03-04 01:56:18', 'sub', NULL, NULL, NULL, NULL, NULL, NULL),
(42, NULL, 69, 16, 59.90, NULL, 0.00, 'pending', 'em_separacao', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'PIX', 'loja', NULL, NULL, 'ASAAS', 'pay_o7xxt84tfso1l045', NULL, '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/5fae386e-2dac-4511-8f80-09d3950413465204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042056', NULL, 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADBElEQVR4Xu2TQY4bMRADffP/f5Rn+eaYRba82CCYYC9pA5R3R63uKvow8u35w/Xr9r3zr6vm1ap5tWperZpXq+bV+m/m48a6Px936vtrf9X66MyWx5A1N5uq0lepKpwq8JMxfM3FZrrvP3hHeSps6pqfYYbIWWgugEtCa36O6SIjqlsaOgqv+RnmM12mf/BjvMmaq01x4q8/IWv+9bPAPEsvPoCKZOLQ/8rWXGtmPrggn9VRXEpVjqm52TyohoRYUN8Td45bc7XptrHZ4AIhKNLR7tZca+JpOLDHro5Dlu2aq01aoFKckzMwg8wcW3OzKVV45iJHF+czywinmmtNkPPUhD/KB69dzzie1txsvgnvgHAzG574mrtNla8Wy54AHAbISXZWzc3mQWmDsHIrJAHn4LrmXnNEofTJ8vVIjkoOwtSrudb0KIYYksLfcznS1qDmbjOS53oYEfXwZwp/Rc3dJl6ugEUyMHESJ+QE1Fxr6hBQzTBeZICH0VeIqrnW9Mwbg7x6dYgjS2M/au42bQD41aeyIJDTCam52zSbpwHi9PCPm1M6FmtuNodRXyj6WON58Q01N5tvxsbcBN0MJM1UHq3mdpN+UCB6oSbcoNs115rq2zHFlpugXbfgpExVc6054s3XADX/UBZNnWbNvaYqAxlMgn2uyPe4mmtNXQXdAn7DPpr2zC3PiKy53BxBtkLU0AUAZ7MiLmLNxSanA5+oUxF4R36QVnOz6XM4MiiNT9ooA9fca2omUFyG1qBp5exHzd3mtMyJFAuTQKAvSTUXm08mdO28YLsZITlcI7Cai82gatrGUzuG8YnRvOZa0yINZiIxJMHmMCk1V5uzlCBIYl79y3Qu/sTWXG2KRhjTOQogRV0nEElmzcUmKM9Q0tjIkfPuOLfmZlOzh94yKOcs2ljpwdb8DNO233Wq8+qHy7zmflOv+R7WRyXpkHZCay43mUI98nOm0HlstvNXc7MpGv5cgnF9AzTQLfHUW8215o9WzatV82rVvFo1r1bNq/Vh5m9W3aiETn7K9AAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/5fae386e-2dac-4511-8f80-09d3950413465204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042056', '2026-03-04 15:46:35', '2026-03-04 15:46:37', 'sub', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `order_addresses`
--

CREATE TABLE `order_addresses` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `street` varchar(255) DEFAULT NULL,
  `number` varchar(20) DEFAULT NULL,
  `complement` varchar(100) DEFAULT NULL,
  `neighborhood` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `order_addresses`
--

INSERT INTO `order_addresses` (`id`, `order_id`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `cep`) VALUES
(9, 1, 'Rua Alvim Borges da Silva', '10', 'Teste', 'Jardim Camburi', 'Vitória', 'ES', '29090-300'),
(10, 10, 'Rua Alvim Borges da Silva', '500', '', 'Jardim Camburi', 'Vitória', 'ES', '29090-300');

-- --------------------------------------------------------

--
-- Estrutura para tabela `order_gateway_logs`
--

CREATE TABLE `order_gateway_logs` (
  `id` bigint(20) NOT NULL,
  `store_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `provider` varchar(50) NOT NULL DEFAULT 'ASAAS',
  `action_key` varchar(100) NOT NULL,
  `http_status` int(11) DEFAULT NULL,
  `request_payload` longtext DEFAULT NULL,
  `response_payload` longtext DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variation_id` int(11) DEFAULT NULL,
  `variation_label` varchar(120) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `line_total` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `variation_id`, `variation_label`, `product_name`, `sku`, `image_url`, `quantity`, `price`, `discount_amount`, `line_total`) VALUES
(1, 1, 163, NULL, NULL, 'Bandeja De Metal Média: UTHC', NULL, NULL, 1, 40.00, 0.00, 0.00),
(2, 2, 164, 201, NULL, 'Bandeja Metal Média com Divisória - Happy 420 - Bandeja Metal Média com Divisória - Happy 420', NULL, NULL, 1, 40.00, 0.00, 0.00),
(3, 2, 162, NULL, NULL, 'Bandeja De Metal Box Sadhu Model:Shiva', NULL, NULL, 1, 55.00, 0.00, 0.00),
(4, 3, 163, NULL, NULL, 'Bandeja De Metal Média: UTHC', NULL, NULL, 1, 40.00, 0.00, 0.00),
(6, 8, 100, NULL, NULL, 'Produto teste', NULL, NULL, 1, 40.00, 0.00, 0.00),
(7, 9, 101, NULL, NULL, 'Produto teste', NULL, NULL, 1, 40.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `order_logistics_history`
--

CREATE TABLE `order_logistics_history` (
  `id` bigint(20) NOT NULL,
  `order_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `status_key` varchar(50) NOT NULL,
  `status_label` varchar(120) NOT NULL,
  `notes` text DEFAULT NULL,
  `tracking_code` varchar(120) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` varchar(100) DEFAULT 'system',
  `changed_at` timestamp NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `plans`
--

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `slug` varchar(50) DEFAULT NULL,
  `display_name` varchar(60) DEFAULT NULL,
  `badge` varchar(30) DEFAULT NULL,
  `headline` varchar(120) DEFAULT NULL,
  `summary` varchar(255) DEFAULT NULL,
  `footer_note` varchar(80) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `currency` char(3) NOT NULL DEFAULT 'BRL',
  `price_monthly` decimal(10,2) DEFAULT NULL,
  `price_annual_monthly_equivalent` decimal(10,2) DEFAULT NULL,
  `annual_billing_price_total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `plans`
--

INSERT INTO `plans` (`id`, `slug`, `display_name`, `badge`, `headline`, `summary`, `footer_note`, `is_active`, `currency`, `price_monthly`, `price_annual_monthly_equivalent`, `annual_billing_price_total`) VALUES
(1, 'start', 'Start', NULL, 'Para quem está começando no digital.', 'Ideal para quem está iniciando no digital e quer colocar a loja no ar rápido, sem complicação.', 'Desconto no primeiro ano', 1, 'BRL', 59.90, 49.90, NULL),
(2, 'growth', 'Growth', '', 'Para quem já vende e quer crescer de verdade', 'Perfeito para lojas que já estão rodando e querem aumentar conversão e faturamento.', 'Desconto no primeiro ano', 1, 'BRL', 139.90, 99.90, NULL),
(3, 'pro', 'Pro', NULL, 'Para maximizar lucro', 'Para quem quer estrutura profissional e mais margem.', NULL, 1, 'BRL', 299.90, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `plan_billing`
--

CREATE TABLE `plan_billing` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
  `interval_unit` enum('month','year') NOT NULL DEFAULT 'month',
  `interval_count` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `plan_billing`
--

INSERT INTO `plan_billing` (`id`, `plan_id`, `billing_cycle`, `interval_unit`, `interval_count`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'monthly', 'month', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00'),
(2, 2, 'monthly', 'month', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00'),
(3, 3, 'monthly', 'month', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00'),
(4, 1, 'annual', 'year', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00'),
(5, 2, 'annual', 'year', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00'),
(6, 3, 'annual', 'year', 1, 1, '2026-02-27 03:24:00', '2026-02-27 03:24:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `plan_features`
--

CREATE TABLE `plan_features` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `feature_text` varchar(160) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `is_highlight` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `plan_features`
--

INSERT INTO `plan_features` (`id`, `plan_id`, `feature_text`, `sort_order`, `is_highlight`, `created_at`) VALUES
(1, 1, 'Produtos ilimitados', 1, 0, '2026-02-26 21:35:26'),
(2, 1, 'Checkout otimizado', 2, 0, '2026-02-26 21:35:26'),
(3, 1, 'Integração com meios de pagamento', 3, 0, '2026-02-26 21:35:26'),
(4, 1, 'Suporte via chat', 4, 0, '2026-02-26 21:35:26'),
(5, 1, 'Integração com Melhor Envio', 5, 0, '2026-02-26 21:35:26'),
(6, 1, 'Temas prontos', 6, 0, '2026-02-26 21:35:26'),
(7, 2, 'Todas as funções do plano Start', 1, 1, '2026-02-26 21:35:26'),
(8, 2, 'Atendimento via WhatsApp', 2, 0, '2026-02-26 21:35:26'),
(9, 2, 'Criador de páginas de venda', 3, 0, '2026-02-26 21:35:26'),
(10, 2, 'Upsell e cross-sell', 4, 0, '2026-02-26 21:35:26'),
(11, 2, 'Cashback', 5, 0, '2026-02-26 21:35:26'),
(12, 3, 'Todas as funções do plano Growth', 1, 1, '2026-02-26 21:35:26'),
(13, 3, 'Integração com marketplaces', 2, 0, '2026-02-26 21:35:26'),
(14, 3, 'Sistema de afiliados', 3, 0, '2026-02-26 21:35:26'),
(15, 3, 'Suporte prioritário', 4, 0, '2026-02-26 21:35:26'),
(16, 3, 'Relatórios avançados', 5, 0, '2026-02-26 21:35:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `plan_limits`
--

CREATE TABLE `plan_limits` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `limit_key` varchar(60) NOT NULL,
  `limit_value` bigint(20) DEFAULT NULL,
  `is_unlimited` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `plan_limits`
--

INSERT INTO `plan_limits` (`id`, `plan_id`, `limit_key`, `limit_value`, `is_unlimited`, `created_at`) VALUES
(1, 1, 'max_products', NULL, 1, '2026-02-26 21:35:26'),
(2, 1, 'max_categories', 50, 0, '2026-02-26 21:35:26'),
(3, 1, 'max_orders_month', 500, 0, '2026-02-26 21:35:26'),
(4, 2, 'max_products', NULL, 1, '2026-02-26 21:35:26'),
(5, 2, 'max_categories', 200, 0, '2026-02-26 21:35:26'),
(6, 2, 'max_orders_month', 3000, 0, '2026-02-26 21:35:26'),
(7, 3, 'max_products', NULL, 1, '2026-02-26 21:35:26'),
(8, 3, 'max_categories', NULL, 1, '2026-02-26 21:35:26'),
(9, 3, 'max_orders_month', NULL, 1, '2026-02-26 21:35:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `platform_config`
--

CREATE TABLE `platform_config` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `platform_config`
--

INSERT INTO `platform_config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES
(1, 'landing_title', 'MinhaBagg', '2026-01-20 02:29:57'),
(2, 'landing_subtitle', 'Crie sua Loja Profissional<br><span style=\"background: linear-gradient(90deg, #fba743, #e05818); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;\">Em Menos de 1 Minuto</span>', '2026-01-20 02:29:57'),
(3, 'landing_primary_color', '#fba743', '2026-01-20 02:29:57'),
(4, 'landing_secondary_color', '#e05818', '2026-01-20 02:29:57'),
(5, 'landing_feature_1_title', 'Rápido', '2026-01-20 02:29:57'),
(6, 'landing_feature_1_text', 'Configure sua loja completa em menos de um minuto', '2026-01-20 02:29:57'),
(7, 'landing_feature_1_icon', 'zap', '2026-01-20 02:29:57'),
(8, 'landing_feature_2_title', 'Personalizável', '2026-01-20 02:29:57'),
(9, 'landing_feature_2_text', 'Cores, imagens e layout totalmente ajustáveis', '2026-01-20 02:29:57'),
(10, 'landing_feature_2_icon', 'palette', '2026-01-20 02:29:57'),
(11, 'landing_feature_3_title', '100% Responsivo', '2026-01-20 02:29:57'),
(12, 'landing_feature_3_text', 'Perfeito em celular, tablet e desktop', '2026-01-20 02:29:57'),
(13, 'landing_feature_3_icon', 'smartphone', '2026-01-20 02:29:57'),
(55, 'trial_days', '7', '2026-01-21 00:54:49'),
(56, 'platform_name', 'MinhaBaggded', '2026-01-21 01:04:30'),
(57, 'admin_primary_color', '#1a70cb', '2026-01-23 05:32:20'),
(58, 'admin_secondary_color', '#e3622b', '2026-01-21 02:06:32'),
(79, 'store:15:marketplace.mobile_notifications', '1', '2026-03-03 03:48:12'),
(80, 'store:15:marketplace.catalog_sync_interval_min', '30', '2026-03-03 03:48:12'),
(81, 'store:15:marketplace.order_sync_interval_min', '5', '2026-03-03 03:48:12'),
(82, 'store:15:marketplace.auto_sync_enabled', '1', '2026-03-03 03:48:12'),
(83, 'store:15:marketplace.error_alerts_enabled', '1', '2026-03-03 03:48:13'),
(84, 'store:15:affiliate.default_commission_type', 'fixed', '2026-03-03 04:55:11'),
(85, 'store:15:affiliate.default_commission_value', '10', '2026-03-03 04:30:14'),
(86, 'store:56:marketplace.mobile_notifications', '1', '2026-03-03 05:02:02'),
(87, 'store:56:marketplace.catalog_sync_interval_min', '30', '2026-03-03 05:02:02'),
(88, 'store:56:marketplace.order_sync_interval_min', '5', '2026-03-03 05:02:02'),
(89, 'store:56:marketplace.auto_sync_enabled', '1', '2026-03-03 05:02:02'),
(90, 'store:56:marketplace.error_alerts_enabled', '1', '2026-03-03 05:02:02');

-- --------------------------------------------------------

--
-- Estrutura para tabela `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `barcode` varchar(60) DEFAULT NULL,
  `shortDescription` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `seo_title` varchar(255) DEFAULT NULL,
  `seo_description` varchar(255) DEFAULT NULL,
  `basePrice` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT 0.00,
  `promotional_price` decimal(10,2) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `brand` varchar(120) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `mainImage` int(11) DEFAULT 0,
  `shippingType` varchar(20) DEFAULT 'free',
  `shippingPrice` decimal(10,2) DEFAULT 0.00,
  `weight_kg` decimal(10,3) DEFAULT NULL,
  `height_cm` decimal(10,2) DEFAULT NULL,
  `width_cm` decimal(10,2) DEFAULT NULL,
  `length_cm` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `published_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `products`
--

INSERT INTO `products` (`id`, `store_id`, `name`, `sku`, `barcode`, `shortDescription`, `description`, `seo_title`, `seo_description`, `basePrice`, `cost_price`, `promotional_price`, `category`, `brand`, `active`, `mainImage`, `shippingType`, `shippingPrice`, `weight_kg`, `height_cm`, `width_cm`, `length_cm`, `created_at`, `published_at`, `updated_at`) VALUES
(3, 56, 'Óculos Ray-Ban RB4428', NULL, NULL, 'Os óculos de sol Ray-Ban RB4428 são um complemento elegante e estiloso para qualquer guarda-roupa. A armação quadrada preta fosca e as lentes polarizadas proporcionam um visual moderno e excelente proteção solar. Esses óculos de sol são perfeitos para o dia a dia, seja para fazer compras ou ir à praia.', 'Formato da armação: Quadrada\nCor da armação: Fosco Preto \nMaterial da armação: Propionato\nCor das hastes: Preto\nCor das lentes: Preto\nTamanho: 56 21mm\nAltura da lente: 43,5mm\nComprimento da haste: 145mm', NULL, NULL, 1220.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'fixo', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 13:55:59', NULL, '2026-03-03 17:18:01'),
(4, 15, 'Seda Tatu do Bem King Size Brown', NULL, NULL, 'A marca Tatu do Bem busca fornecer produtos diferenciados, com qualidade e preços competitivos. Papel ultrafino com 13g por m² e possui marca d\'água.', '* Características do produto: - Marca: Tatu do Bem - Quantidade: Cada livreto contém 32 folhas- Dimensões: 105 x 45 mm - Modelo: King Size Brown', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 2, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 14:11:51', NULL, '2026-03-03 02:55:18'),
(5, 15, 'Seda King Paper Brown', NULL, NULL, 'fabricados sem o uso de cloro (unbleached), essa opção oferece um toque suave e uma fumada mais pura, preservando o sabor do recheio.', '* Características do produto: - Marca: King Paper - Quantidade:Cada livreto contém 33 folhas - Dimensões: 108 x 44 mm - Modelo: King Size Brown\n', NULL, NULL, 4.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 14:44:17', NULL, '2026-03-03 02:55:18'),
(6, 15, 'Seda King Paper White', NULL, NULL, 'fabricados sem o uso de cloro (unbleached), essa opção oferece um toque suave e uma fumada mais pura, preservando o sabor do recheio.', '* Características do produto: - Marca: King Paper - Quantidade:Cada livreto contém 33 folhas - Dimensões: 108 x 44 mm - Modelo: King Size White', NULL, NULL, 4.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 14:54:38', NULL, '2026-03-03 02:55:18'),
(7, 15, 'Seda Guru Spirit Longa Slim ', NULL, NULL, ' Seda Guru Spirit Longa Slim é perfeita para quem busca uma sessão mais equilibrada, com menos papel e mais sabor. Produzida com papel ultrafino e natural, ela proporciona queima lenta e uniforme, preservando ao máximo as características da sua erva.', 'Com o formato Longa Slim, é ideal para quem prefere bolados mais finos e alongados, com praticidade e elegância. A embalagem com 20 livretos é ideal tanto para consumo pessoal quanto para revenda.\n\n - Marca: Guru Spirit- Quantidade: Cada livreto possui 35 folhas - Dimensões: 140 x 36 - Modelo: Longa Slim', NULL, NULL, 7.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 15:39:02', NULL, '2026-03-03 02:55:18'),
(8, 15, ' Seda Zomo Slim King Size Alfafa', NULL, NULL, 'A Zomo é referência quando o assunto é qualidade!\\rReconhecida internacionalmente por suas essências de narguile e carvões a Zomo está entrando firme no comércio de sedas, não é a toa que está sendo nos últimos meses uma das sedas mais vendidas no Brasil.', '*Características do produto:- Marca: Zomo- Quantidade:Cada livreto contém 33 folhas- Dimensões: 108 x 36 mm- Modelo: Slim King Size Alfafa', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 15:46:28', NULL, '2026-03-03 02:55:18'),
(9, 15, 'Seda Bem Bolado Marcelo D2 King Size', NULL, NULL, 'Bem Bolado firmou uma parceria e agora é Marcelo D2 e Bem Bolado Brasil lado a lado. Nova linha da Bem Bolado em parceria com o rapper brasileiro Marcelo D2.', 'Características do produto:\n- Marca: Bem Bolado \n- Quantidade:livretos com 35 folhas em cada\n- Dimensões: 110 x 36 mm\n- Gramatura: 14 g/m²\n- Modelo: Marcelo D2 King Size', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 15:57:18', NULL, '2026-03-03 02:55:18'),
(10, 15, 'Seda Lion Rolling Circus', NULL, NULL, 'Assim como é frisado na embalagem, estes são papéis finíssimos de queima lenta e proveitosa e seguindo a tradição da marca, o papel é 100% natural e a cola é feita de goma arábica', '* Características do produto: - Marca: Lion Rolling - Quantidade:Cada livreto contém 32 folhas - Dimensões: 110 x 36mm - Modelo: Lion Circus King Size', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:06:14', NULL, '2026-03-03 02:55:18'),
(11, 15, 'Seda Zomo Slim King Size', NULL, NULL, 'A Zomo é referência quando o assunto é qualidade! Reconhecida internacionalmente por suas essências de narguile e carvões a Zomo está entrando firme no comércio de sedas, não é a toa que está sendo nos últimos meses uma das sedas mais vendidas no Brasil.', '* Características do produto: - Marca: Zomo - Quantidade:Cada livreto contém 33 folhas - Dimensões: 108 x 36 mm - Modelo: Slim King Size', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 2, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:15:31', NULL, '2026-03-03 02:55:18'),
(12, 15, 'Seda Bem Bolado Pop King Size Slim 100 Folhas', NULL, NULL, ' Seda Bem Bolado Pop King Size Slim é ideal para quem busca qualidade, praticidade e estilo na hora de bolar. Composta por 40 livretos, cada um contendo 100 folhas no formato king size slim (110 mm x 36 mm)', '* Características do produto: - Marca: Bem Bolado - Quantidade:Cada livreto contém 33 folhas - Dimensões: 110 x 36mm - Modelo:  King Size Slim', NULL, NULL, 12.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:23:05', NULL, '2026-03-03 02:55:18'),
(13, 15, 'Seda Papelito King Size Slim', NULL, NULL, 'A linha da Papelito apresenta textura fina, firme e maleável, o que facilita o manuseio até mesmo para os pasteleiros.A seda queima de forma lenta e uniforme, produzindo cinzas quase imperceptíveis.Ela possui um preço super em conta e uma qualidade excelente. Compre e não se arrependa.', '* Características do produto: - Marca: Papelito- Quantidade:Cada livreto contém 36 folhas - Dimensões: 108 x 36 mm - Modelo: King Size Slim', NULL, NULL, 7.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:30:55', NULL, '2026-03-03 02:55:18'),
(14, 15, ' Seda Zomo Brown Natural King Size ', NULL, NULL, 'A Zomo é referência quando o assunto é qualidade! Reconhecida internacionalmente por suas essências de narguile e carvões a Zomo está entrando firme no comércio de sedas, não é a toa que está sendo nos últimos meses uma das sedas mais vendidas no Brasil.', '* Características do produto: - Marca: Zomo - Quantidade: Cada Livretos contém 33 folhas - Dimensões: 108 x 44 mm- Modelo: Natural Perfect Brown King Size', NULL, NULL, 4.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:40:18', NULL, '2026-03-03 02:55:18'),
(15, 15, 'Seda Bem Bolado MC Kevin Brown King Size Large', NULL, NULL, 'Para celebrar a carreira de um dos MC\'s mais influentes do Brasil, lançamos uma colaboração inesquecível. A seda king size large vem em papel brown, com três capas distintas, e utiliza goma arábica natural.', '* Características do produto- Marca: Bem Bolado - Quantidade: Cada livreto possui 35 folhas- Dimensões: 110 x 44 mm', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 2, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 16:48:36', NULL, '2026-03-03 02:55:18'),
(16, 15, ' Seda Zomo Paper Perfect Pink King Size', NULL, NULL, 'Incrível novidade da Zomo, papel Perfect Pink, seda clássica na cor top do rosa.Papel especial para dar um charme na sua session, deixando ainda mais estiloso, perfeito para usar e abusar nas fotos.Quem ai não ama uma sessão colorida? ', '* Características do produto- Marca: Zomo- Quantidade: Cada livreto contém 33 folhas- Dimensões: 108 x 44 mm- Modelo: Perfect Pink King Size', NULL, NULL, 4.00, 0.00, NULL, 'Sedas', NULL, 1, 2, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 17:01:51', NULL, '2026-03-03 02:55:18'),
(17, 15, 'Celulose Aleda Verde ', NULL, NULL, 'A aLeda é um papel de enrolar elaborado em celulose e totalmente transparente, o que te permite de ver o que fumas.  Uma maravilha de seda, 100% original.Além disso, é totalmente biodegradável', '*Características principais do produto- Marca: aLeda- Quantidade: Cada livreto possui 40 folhas- Dimensões:  110 x 38 mm- Composição: Celulose - Modelo: King Size', NULL, NULL, 5.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 17:10:35', NULL, '2026-03-03 02:55:18'),
(18, 15, 'Piteira A Piteira Mega Longa ', NULL, NULL, 'Com medidas de 40mm x 55mm, o modelo Mega Longa oferece maior conforto no uso, melhorando o fluxo e proporcionando uma pegada mais firme. Ideal para quem prefere piteiras amplas, resistentes e que mantêm a estrutura do início ao fim,totalmente livre de cloro, garantindo uma filtragem mais pura e segura.', '*Características do produto: \n\n- Marca: A Piteira\n\n- Quantidade: 20 Blocos\n\n- Dimensão: 40mmx55mm\n\n- Composição: Papel livre de cloro\n\n- Modelo: Mega Longa', NULL, NULL, 9.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 17:30:05', NULL, '2026-03-03 02:55:18'),
(19, 15, ' Piteira Papelito Longa Dupla 2x1', NULL, NULL, 'A papelito inovou e agora traz em seu catálogo de produtos a mais nova Piteira Longa Dupla 2x1,piteiras biodegradáveis, sem tinta e totalmente maleável. Cada Bloco vem com 2 piteiras é uma só folha proporcionando praticidade na hora da sua sessão', '* Características do produto - Marca: Papelito - Quantidade: Cada bloquinho possui 72 piteiras descartáveis - Dimensões: 4 x 4 cm (Duas piteiras de 4cm em 1 Folha)- Modelo: Longa Dupla 2x1', NULL, NULL, 7.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 17:42:08', NULL, '2026-03-03 02:55:18'),
(20, 15, 'Piteira Bem Bolado Girls In Green Hiper Large Vergê', NULL, NULL, 'Fabricada com papel vergê, as piteiras Super Large Bem Bolado & Girls in Green são as primeiras do mercado a incluírem um mini-manual de Redução de Danos por livreto. Produto amigo da natureza com edição limitada. Outro diferencial é a impressão da embalagem em tinta especial, que brilham na luz Neon.', '* Características do produto - Marca: Bem Bolado- Quantidade: Cada livreto contém 50 folhas - Dimensões: 6 x 5 cm - Modelo: Vergê', NULL, NULL, 7.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 2, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 18:35:00', NULL, '2026-03-03 02:55:18'),
(21, 15, 'Piteira To Na Bê Mega Longa ', NULL, NULL, ' Piteira To Na Bê Mega Longa  de papel vergê de alta qualidade, ela garante uma experiência de uso suave e agradável. O design mega longo proporciona facilidade na montagem de seus cigarros, ideal para quem busca praticidade e eficiência. Compacta e fácil de transportar, essa piteira é uma ótima escolha para quem não abre mão de qualidade e estilo na hora de fumar.', '* Características do produto - Marca: To Na Bê - Quantidade: Cada bloco contém 35 piteiras - Dimensões: 8 x 5,5 cm - Modelo: Mega Longa - Composição: Papel Vergê', NULL, NULL, 9.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 18:42:05', NULL, '2026-03-03 02:55:18'),
(22, 15, 'Piteira ToNaBê Extra Large Premium ', NULL, NULL, 'Apresentamos a Piteira de Papel com 24 Livretos de 50 Folhas Vergê, uma escolha premium para quem valoriza qualidade. Desenvolvido pela TonaBê, As piteiras TonaBê são reconhecidas pela sua durabilidade e desempenho superior, garantindo um fluxo de ar e um toque favorável em cada tragada.', 'Dimensões do Papel: 4,5 x 6cm\nFolhas por Piteira: 50 folhas\nModelo: Extra Large', NULL, NULL, 7.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 19:03:03', NULL, '2026-03-03 02:55:18'),
(23, 15, 'Piteira The Bulldog', NULL, NULL, 'Com as piteiras de papel não é diferente. Estas piteiras fazem parte da linha Brown. Papel fabricado de forma natural, sem adição de quaisquer corantes, tornando a experiência mais limpa e pura.', 'Informações Adicionais:\nTamanho: 60x20mm\nConteúdo: 33 Folhas', NULL, NULL, 3.00, 0.00, NULL, 'Piteira de papel', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 19:13:07', NULL, '2026-03-03 02:55:18'),
(24, 15, 'Tabaco Acrema Blend 20g', NULL, NULL, 'Acrema Blend extra fino, tabaco claro com corte longo perfeito para sua mistura,podendo ser usada e lacrada novamente com segurança pelo sistema de zip abre e fecha.', '* Características do produto \n- Marca: Acrema \n- Quantidade 1 pacote contem 20g \n- Dimensões do tabaco: 11 x 8 x 1 cm\n\n', NULL, NULL, 20.00, 0.00, NULL, 'Tabacos', NULL, 1, 0, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 20:14:39', NULL, '2026-03-03 02:55:18'),
(25, 15, 'Tabaco Véio Pimenta Rosin Premium 25g', NULL, NULL, 'Tabaco Véio PimentaGold puro, com sabor levemente adocicado, fazendo com que não tenha aquela sensação de amargor na boca, e uma leveza pra quem procura um bom tabaco para relaxar. Cada pacotes de 25g e a melhor parte, cada pacote contém 1 piteira de vidro Glass Crew. ', '*Características do produto:\n- Marca: Véio Pimenta\n- Quantidade: 10 Pacotes de 25 g + Piteira de Vidro\n- Dimensões: 13,5 x 9 cm', NULL, NULL, 25.00, 0.00, NULL, 'Tabacos', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 20:24:41', NULL, '2026-03-03 02:55:18'),
(26, 15, 'Tabaquin 20g', NULL, NULL, 'Tabaco desfiado claro, sem talos, com fios longos e sabor suave. Um produto com qualidade .', '* Características do produto:\n- Marca: HBT\n- Quantidade: 5 Pacotes de 20 g\n- Dimensões: 10 x 7 cm\\r', NULL, NULL, 20.00, 0.00, NULL, 'Tabacos', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 20:32:25', NULL, '2026-03-03 02:55:18'),
(27, 15, 'Tabaco La Revolución Golden LRV 15g', NULL, NULL, 'O Tabaco La Revolución Golde é um produto premium com folhas selecionadas; tabaco natural do tipo Golden Virgínia. Possui características suaves, ideias para ser utilizado com misturas. Vem armazenado em embalagens ziplock e velcro para preservar toda a qualidade do produto.', '*Características do produto:\n- Marca: LRV\n- Quantidade: Cada Pacote contem 15 g\n- Dimensões da Caixa: 12,9 x 12 x 12', NULL, NULL, 15.00, 0.00, NULL, 'Tabacos', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 20:37:10', NULL, '2026-03-03 02:55:18'),
(28, 15, 'Tabaco Amsterdam 25g', NULL, NULL, 'Tabaco nacional desenvolvido pela Amsterdam Tabaco, com fumo natural 100% livre de aditivos. Além disso, sua embalagem é reciclável, não agride o meio ambiente. ', '* Características do produto:\n- Marca: Amsterdam\n- Quantidade: Cada Pacotes contem 25 g\n- Dimensões: 8 x 14 cm', NULL, NULL, 20.00, 0.00, NULL, 'Tabacos', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-19 20:42:31', NULL, '2026-03-03 02:55:18'),
(31, 15, 'Slick De Silicone Sadhu 5 ml Black ', NULL, NULL, 'Feito de silicone, sendo resistente ao calor, além de possuir um belo design.', 'O slick é essencial para guardar seu fumo, e principalmente suas extrações, pois se não for armazenado de forma correta, ele pode mofar, sua textura pode mudar.\n\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1 Slick Sadhu \n- Capacidade: 5 ml\n- Dimensões: 3 x 2 cm', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 17:44:59', NULL, '2026-03-03 02:55:18'),
(32, 15, 'Slick Silicone Sessãozada 5 ml Verde', NULL, NULL, 'O Slick Silicone para Armazenamento Sessãozada 5 ml  é a solução perfeita para quem busca praticidade e eficiência no armazenamento de produtos de tabacaria.', 'O design compacto e a vedação perfeita evitam vazamentos e preservam o frescor dos produtos, garantindo máxima durabilidade. Além disso, o silicone é fácil de limpar, reutilizável e resistente, proporcionando a organização que você precisa no seu dia a dia. \n\n* Características dos produtos:\n- Marca: Sessãozada\n- Capacidade: 5 ml\n- Quantidade: 1 Slick Sessãozada Verde\n- Dimensões: 2 (altura) x 3 cm (largura) \n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 18:01:04', NULL, '2026-03-03 02:55:18'),
(33, 15, 'Slick de Silicone Sessãozada 11 ml Verde', NULL, NULL, 'O Slick de Silicone Sessãozada 11 ml é a escolha ideal para quem busca praticidade e eficiência no armazenamento e manuseio de substâncias de tabacaria', 'Feito de silicone de alta qualidade, oferece uma vedação eficiente, prevenindo vazamentos e mantendo a integridade do conteúdo. Além disso, o silicone é fácil de limpar, reutilizável e durável, proporcionando uma experiência de armazenamento sem complicação.\n\n* Características dos produtos:\n- Marca: Sessãozada\n- Capacidade: 11 ml\n- Quantidade: 1 Slick Sessãozada verde\n- Dimensões: 2 (altura) x 4,5 cm (diâmetro) \n- Composição: Silicone ', NULL, NULL, 25.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 18:05:36', NULL, '2026-03-03 02:55:18'),
(34, 15, 'Slick de Slicone Cifrão 15ml Vermelha', NULL, NULL, 'Slick Cifrão é um recipiente prático e estiloso, ideal para armazenar e conservar ervas, fumo ou extratos com segurança. ', ' Fabricado em material resistente, ele possui vedação eficiente que impede a entrada de ar e umidade, mantendo o conteúdo sempre fresco.\n\n*Características:\n\n \n\n-Marca: Apex\n-Quantidade: 1 un\n-Dimensões:3cm(largura) x 3,5cm(altura)\n-Composição: Silicone\n-Modelo: Slick Cifrão Vermelha', NULL, NULL, 35.00, 0.00, NULL, 'Slick ', NULL, 1, 1, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 18:16:55', NULL, '2026-03-03 02:55:18'),
(35, 15, 'Slick de Slicone Cifrão 15ml Cinza', NULL, NULL, 'Slick Cifrão é um recipiente prático e estiloso, ideal para armazenar e conservar ervas, fumo ou extratos com segurança. ', 'Fabricado em material resistente, ele possui vedação eficiente que impede a entrada de ar e umidade, mantendo o conteúdo sempre fresco.\n\n*Características:\n-Marca: Apex\n-Quantidade: 1 un\n-Dimensões:3cm(largura) x 3,5cm(altura)\n-Composição: Silicone\n-Modelo: Slick Cifrão Cinza', NULL, NULL, 35.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 20:54:43', NULL, '2026-03-03 02:55:18'),
(36, 15, 'Case Medium Bola Ai', NULL, NULL, 'Case é ideal para quem deseja se destacar com estilo e originalidade, mostrando sua paixão por essas referências que conquistaram milhões de fãs.', 'O Case Medium Bola Ai é uma peça criativa e divertida que mistura o universo dos personagens da cultura pop, criando uma combinação única de estilos e temas. A case apresenta ilustrações vibrantes e cheias de personalidade. Perfeita para quem ama uma boa dose de diversão.\n\n* Características do produto:\n- Material: EVA rígido\n- Dimensões:16 x 10 x 4 cm\n- Modelo: G', NULL, NULL, 50.00, 0.00, NULL, 'Case ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 21:04:47', NULL, '2026-03-03 02:55:18'),
(37, 15, 'Tesoura Dobrável Abduzido Rosa', NULL, NULL, 'A Tesoura Abduzido Dobrável é indicada para picotar seu tabaco e triturar sua matéria prima.', 'composto por aço com acabamento em metal, suas lâminas em aço, prolongam a vida útil do produto. Sua função dobrável torna a tesoura segura e compacta, escondendo suas lâminas.\n\n* Características do produto:\n- Marca: Abduzido\n- Quantidade: 1 Tesoura\n- Dimensão: 9,5 x 5 cm (Aberta) , 8,5 x 2,5 (Fechada)\n- Composição: Lâmina aço inoxidável e o dedal em policarbonato de alta resistência \n- Modelo: Dobrável', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 21:22:25', NULL, '2026-03-03 02:55:18'),
(38, 15, 'Tesoura Dobrável Sessãozada Preta', NULL, NULL, 'A Tesoura Sessãozada Dobrável é indicada para picotar seu tabaco e triturar sua matéria prima.', 'Possui elo para chaveiro, sua lâmina é de aço inoxidável e o dedal em policarbonato de alta resistência.Seu grande dedal permite confortavelmente o seu manuseio. Corte afiado, duradouro e dobrável.\n* Características do produto:\n- Marca: Sessâozada Preta\n- Quantidade: 1 Tesoura\n- Dimensão: 10 x 5 cm (Aberta) , 8,5 x 2,5 (Fechada)\n- Composição: Lâmina aço inoxidável e o dedal em policarbonato de alta resistência \n- Modelo: Dobrável', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 21:38:08', NULL, '2026-03-03 02:55:18'),
(39, 15, 'Tesoura Dobrável Sadhu Preto', NULL, NULL, 'A Tesoura Sadhu Dobrável é indicada para picotar seu tabaco e triturar sua matéria prima.', 'Composto por aço com acabamento em metal, suas lâminas em aço, prolongam a vida útil do produto. Sua função dobrável torna a tesoura segura e compacta, escondendo suas lâminas.\n\n* Características do produto:\n- Marca: Sadhu Preta\n- Quantidade: 1 Tesoura\n- Dimensão: 10 x 5 cm (Aberta) , 8,5 x 2,5 (Fechada)\n- Composição: Lâmina aço inoxidável e o dedal em policarbonato de alta resistência \n- Modelo: Dobrável', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 21:47:46', NULL, '2026-03-03 02:55:18'),
(40, 15, 'Tesoura Dobrável Sadhu Laranja', NULL, NULL, 'A Tesoura Sadhu Dobrável é indicada para picotar seu tabaco e triturar sua matéria prima.', 'Composto por aço com acabamento em metal, suas lâminas em aço, prolongam a vida útil do produto. Sua função dobrável torna a tesoura segura e compacta, escondendo suas lâminas.\n\n* Características do produto:\n- Marca: Sadhu / Laranja\n- Quantidade: 1 Tesoura\n- Dimensão: 10 x 5 cm (Aberta) , 8,5 x 2,5 (Fechada)\n- Composição: Lâmina aço inoxidável e o dedal em policarbonato de alta resistência \n- Modelo: Dobrável', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-20 21:52:24', NULL, '2026-03-03 02:55:18'),
(42, 15, 'Tesoura de Metal Na Boa Ponta Arredondada', NULL, NULL, 'A Tesoura de Metal Na Boa oferecendo precisão e facilidade no corte. Fabricada em aço inoxidável de alta resistência.', 'Suas lâminas afiadas garantem cortes rápidos e precisos em diversos tipos de materiais utilizados na preparação de charutos e cigarrilhas. Seu design ergonômico proporciona conforto e controle,\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Tesoura\n- Dimensão: 9,5 x 4,5 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 00:46:03', NULL, '2026-03-03 02:55:18'),
(43, 15, 'Tesoura de Metal Na Boa Prata', NULL, NULL, ' A marca Na Boa é a ferramenta perfeita para quem busca precisão e estilo no manuseio de tabacos e outros materiais.', 'Fabricada com metal de alta qualidade, garante cortes eficientes e duradouros. Seu design sofisticado e decorado adiciona um toque de elegância ao ambiente da tabacaria.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Tesoura\n- Dimensão: 11 x 5,8\n- Composição: Metal', NULL, NULL, 40.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:06:02', NULL, '2026-03-03 02:55:18'),
(44, 15, 'Tesoura de Metal Na Boa Ponta Arredondada', NULL, NULL, 'A Tesoura de Metal Na Boa oferecendo precisão e facilidade no corte. Fabricada em aço inoxidável de alta resistência.', 'Fabricada em aço inoxidável de alta resistência, suas lâminas afiadas garantem cortes rápidos e precisos em diversos tipos de materiais utilizados na preparação de charutos e cigarrilhas.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Tesoura\n- Dimensão: 9,5 x 4,5 cm\n- Composição: Metal', NULL, NULL, 40.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:11:03', NULL, '2026-03-03 02:55:18'),
(45, 15, 'Tesoura Dobrável Sadhu Azul', NULL, NULL, 'A Tesoura Sadhu Dobrável é indicada para picotar seu tabaco e triturar sua matéria prima.', 'Possui elo para chaveiro, sua lâmina é de aço inoxidável e o dedal em policarbonato de alta resistência.Seu grande dedal permite confortavelmente o seu manuseio.\n\n* Características do produto:\n - Marca: Sadhu / Azul\n - Quantidade: 1 Tesoura \n - Dimensão: 10 x 5 cm (Aberta) , 8,5 x 2,5 (Fechada) \n - Composição: Lâmina aço inoxidável e o dedal em policarbonato de alta resistência \n - Modelo: Dobrável', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:20:17', NULL, '2026-03-03 02:55:18'),
(46, 15, 'Tesoura de Metal Na Boa Dourada', NULL, NULL, 'Tesoura de Metal Na Boa Ponta Arredondada.', ' Com um design elegante e exclusivo, esta tesoura apresenta detalhes decorativos que a tornam única e sofisticada, adicionando um toque especial ao seu espaço de tabacaria. Feita com materiais de alta qualidade, ela garante cortes precisos e eficientes.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Tesoura\n- Dimensão: 11 x 4,8 cm \n- Composição: Metal Dourada', NULL, NULL, 40.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:30:13', NULL, '2026-03-03 02:55:18'),
(47, 15, 'Tesoura de Metal Na Boa Gold ', NULL, NULL, 'Tesoura de Metal Na Boa Ponta Arredondada.', 'Com um design elegante e exclusivo, esta tesoura apresenta detalhes decorativos que a tornam única e sofisticada, adicionando um toque especial ao seu espaço de tabacaria. Feita com materiais de alta qualidade, ela garante cortes precisos e eficientes.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Tesoura\n- Dimensão: 11 x 4,8 cm \n- Composição: Metal Dourada', NULL, NULL, 40.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:34:22', NULL, '2026-03-03 02:55:18'),
(48, 15, 'Tesoura Abduzido Pop Inox Model:Rainbow', NULL, NULL, 'A Tesoura Abduzido Pop Inox é perfeita para quem busca leveza, conforto e eficiência em um único produto.', 'Com design ergonômico e moderno, ela é extremamente prática e fácil de manusear, ideal para o uso no dia a dia, seja em casa, no escritório ou em atividades criativas.\nFabricada com lâmina de inox, garante cortes precisos e durabilidade superior. Uma tesoura versátil que une funcionalidade e estilo!\n\n* Características do produto:\n- Marca: Abduzido\n- Quantidade: 1 Tesoura\n- Dimensão: 8,2 x 4,5 cm\n- Composição: Metal', NULL, NULL, 20.00, 0.00, NULL, 'Tesouras', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:48:05', NULL, '2026-03-03 02:55:18'),
(49, 15, 'Slick Silicone SquadaFum Médio 10 ml Azul', NULL, NULL, ' Container Médio Squadafum é ideal para transportar sua crema com seu aspecto e aroma original.', 'Squadafum e um Material que evita que qualquer textura grude em sua superfície e não altera o sabor de sua especiaria. Tem fechamento em rosca e está disponível em diversas combinações de cores com a nossa logo em alto relevo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Capacidade: 10 ml\n- Dimensões:  2 x 3,5 cm\n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 01:58:44', NULL, '2026-03-03 02:55:18'),
(50, 15, 'Slick Silicone SquadaFum Médio 10 ml Laranja', NULL, NULL, 'O Container Médio Squadafum é ideal para transportar sua crema com seu aspecto e aroma original', ' Tem fechamento em rosca e está disponível em diversas combinações de cores com a nossa logo em alto relevo,sem perder nada e sem explanar.\n\n* Características do produto:\n- Marca: SquadaFum\n- Capacidade: 10 ml\n- Dimensões:  2 x 3,5 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:04:09', NULL, '2026-03-03 02:55:18'),
(52, 15, 'Slick de Silicone Na Boa Brilha no Escuro 5 ml', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações.', 'Super fácil de limpar, com alta durabilidade, podendo guardar até comestível. Além disso, brilha no escuro pra dar aquele charme pra sua sessão.\n\n* Características dos produtos:\n- Marca: Na Boa\n- Capacidade: 5 ml\n- Quantidade: 1 Slicks\n- Dimensões: 2 (altura) x 3 cm (largura)\n- Composição: Silicone \n- Modelo: Brilha no Escuro ', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:11:40', NULL, '2026-03-03 02:55:18'),
(53, 15, 'Slick de Silicone Oil Cultura Dab Rosa 2 ml ', NULL, NULL, 'Os Potes de Silicone da Cultura Dab são ideais para o armazenamento e manuseio de extrações.', 'O silicone é feito de material de altíssima qualidade, resistente à temperaturas elevadas, atóxico, maleável, inquebrável, com lavagem fácil, não absorve líquidos e resíduos. Leve e prático, perfeito para colocar no seu kit e levar para todo lugar.\n\n* Características do produto:\n- Marca: Cultura Dab\n- Capacidade: 2 ml\n- Dimensões: 1,7 cm x 2,1 cm', NULL, NULL, 15.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:30:04', NULL, '2026-03-03 02:55:18'),
(54, 15, 'Slick de Silicone Oil Cultura Dab Amarelo 2 ml ', NULL, NULL, 'Os Potes de Silicone da Cultura Dab são ideais para o armazenamento e manuseio de extrações.', 'O silicone é feito de material de altíssima qualidade, resistente à temperaturas elevadas, atóxico, maleável, inquebrável, com lavagem fácil, não absorve líquidos e resíduos. Leve e prático, perfeito para colocar no seu kit e levar para todo lugar.\n\n* Características do produto:\n- Marca: Cultura Dab\n- Capacidade: 2 ml\n- Dimensões: 1,7 cm x 2,1 cm', NULL, NULL, 15.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:33:23', NULL, '2026-03-03 02:55:18'),
(55, 15, 'Slick de Silicone Oil Cultura Dab Verde 2 ml ', NULL, NULL, 'Os Potes de Silicone da Cultura Dab são ideais para o armazenamento e manuseio de extrações.', 'O silicone é feito de material de altíssima qualidade, resistente à temperaturas elevadas, atóxico, maleável, inquebrável, com lavagem fácil, não absorve líquidos e resíduos. Leve e prático, perfeito para colocar no seu kit e levar para todo lugar.\n\n* Características do produto:\n- Marca: Cultura Dab\n- Capacidade: 2 ml\n- Dimensões: 1,7 cm x 2,1 cm', NULL, NULL, 15.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:36:41', NULL, '2026-03-03 02:55:18'),
(56, 15, ' Slick Silicone SquadaFum 3 ml Azul, Rosa e Amarelo', NULL, NULL, 'O Container 3 ml Squadafum é ideal para transportar sua crema com seu aspecto e aroma original.', 'É produzido com silicone de alta qualidade com cura de platina, material que evita que qualquer textura grude em sua superfície e não altera o sabor de sua especiaria. Tem fechamento em rosca e está disponível em diversas combinações de cores com a nossa logo em alto relevo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Capacidade: 3 ml\n- Dimensões:  3 x 1,5 cm\n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:47:39', NULL, '2026-03-03 02:55:18'),
(57, 15, 'Slick Silicone Ball To Na Bê 6 ml Model:Rosa e Preto', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações, ', 'Super fácil de limpar, com alta durabilidade em formato de esfera com diversas cores disponíveis se assemelhando as famosas bolinhas pula pula.\n\n* Características dos produtos:\n- Marca: To Na Bê- Capacidade: 6 ml\n- Quantidade: 1 Slick\n- Dimensões: 4 cm (diâmetro)\n- Composição: Silicone \n- Cor: Selecione no anúncio a cor desejada.', NULL, NULL, 30.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 02:53:37', NULL, '2026-03-03 02:55:18'),
(58, 15, 'Slick Silicone Sessãozada Lego C/ Divisórias 34 ml', NULL, NULL, 'Organize seus pequenos itens com estilo e praticidade com o Kit 5 Slick de Silicone Sessãozada Lego!', ' Este conjunto é perfeito para quem busca uma solução criativa e funcional para armazenar e transportar diversos tipos de produtos.Design Colorido e Divertido: Com um visual inspirado em peças de Lego, cada slick vem em cores vibrantes, tornando a organização mais alegre e atraente.\n\n Características dos produtos:\n- Marca: Sessãozada\n- Capacidade: 34 ml\n- Quantidade: 1 Slicks \n- Dimensões: 11 x 5 x 3 xm\n- Composição: Silicone \n- Modelo: Lego', NULL, NULL, 60.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 03:03:51', NULL, '2026-03-03 02:55:18'),
(59, 15, 'Slick Silicone Na Boa 5 ml Rosa Neon', NULL, NULL, 'Super fácil de limpar, com alta durabilidade, podendo guardar até comestível.', 'O slick é essencial para guardar seu fumo, e principalmente suas extrações, pois se não for armazenado de forma correta, ele pode mofar, sua textura pode mudar, etc. \n\n* Características dos produtos:\n- Marca: Na Boa\n- Capacidade: 5 ml\n- Quantidade: 1 Slick\n- Dimensões: 2 (altura) x 3 cm (largura) \n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 04:22:29', NULL, '2026-03-03 02:55:18'),
(60, 15, 'Slick De Silicone Sadhu 5 ml Colorido:Amarelo, Roxo e Branco', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações.', 'O slick é essencial para guardar seu fumo, e principalmente suas extrações, pois se não for armazenado de forma correta, ele pode mofar, sua textura pode mudar, etc. \n\n* Características dos produtos:\n- Marca: sadhu\n- Capacidade: 5 ml\n- Quantidade: 1 Slick\n- Dimensões: 2 (altura) x 3 cm (largura) \n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 04:38:19', NULL, '2026-03-03 02:55:18'),
(61, 15, 'Slick De Silicone Sadhu 5 ml Colorido:Amarelo e Azul Claro', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações.', 'O slick é essencial para guardar seu fumo, e principalmente suas extrações, pois se não for armazenado de forma correta, ele pode mofar, sua textura pode mudar, etc. \n\n* Características dos produtos:\n- Marca: Sadhu\n- Capacidade: 5 ml\n- Quantidade: 1 Slick\n- Dimensões: 2 (altura) x 3 cm (largura) \n- Composição: Silicone', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 04:41:13', NULL, '2026-03-03 02:55:18'),
(62, 15, 'Slick de Silicone Oil Cultura Dab 5 ml Abelha', NULL, NULL, 'Os Potes de Silicone da Cultura Dab são ideais para o armazenamento e manuseio de extrações.', 'O silicone é feito de material de altíssima qualidade, resistente à temperaturas elevadas, atóxico, maleável, inquebrável, com lavagem fácil, não absorve líquidos e resíduos. Leve e prático, perfeito para colocar no seu kit e levar para todo lugar.\n\n* Características do produto:\n- Marca: Cultura Dab\n- Capacidade: 5 ml\n- Dimensões: 1,8 cm x 3,2 cm\n- Modelo: Redondo', NULL, NULL, 20.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 04:48:46', NULL, '2026-03-03 02:55:18'),
(63, 15, 'Container Slick SquadaFum O.G Triangular Azul', NULL, NULL, 'Slick Container da SquadaFum de modelo grande de altíssima qualidade, feito com silicone.', ' Totalmente resistente a fogo e a água.Além disso, possui um lindo design triangular.Fechamento seguro, possibilitando uma armazenação do seu fumo sem preocupações.\n\n* Características do produto:\n- Marca: SquadaFum\n- Capacidade: 13 ml\n- Dimensões: 5,5 x 5 x 2,5 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 04:56:00', NULL, '2026-03-03 02:55:18'),
(64, 15, 'Slick De Silicone Sadhu 12 ml Com Divisórias Rosa,Laranja e Azul Claro', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações.', 'Feito de silicone, sendo resistente ao calor, além de possuir um belo design com 12 ml Com Divisórias.\n\n* Características do produto:\n- Marca: Sadhu\n- Capacidade: 12 ml\n- Dimensões: 10,5 x 4,5 x 1,5 cm\n- Modelo: Retangular, com divisória', NULL, NULL, 65.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 05:08:46', NULL, '2026-03-03 02:55:18'),
(65, 15, 'Slick de Silicone Silly Dog 9ml', NULL, NULL, 'O slick é essencial para guardar seu fumo, e principalmente suas extrações.', 'O slick é um produto indispensável para quem quer manter sua crema com qualidade.\nTotalmente livre de BPA, feito de silicone e curado em platina.\nProduto 100% lavável, reutilizável e de ótima durabilidade.\n\n* Características do produto:\n- Dimensões: 5,5 x 4,5 x 2,0 cm\n- Material: Silicone com cura de planita\n- Capacidade: 9ml', NULL, NULL, 30.00, 0.00, NULL, 'Slick ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 05:24:25', NULL, '2026-03-03 02:55:18'),
(68, 15, 'Cuia De Silicone Sessãozada: Roxo', NULL, NULL, 'Descubra o equilíbrio perfeito entre tradição e modernidade com a Cuia de Silicone Sessãozada.', 'A Cuia de Silicone Sessãozada é ideal para quem busca praticidade sem abrir mão do estilo. Cada cuia é projetada para oferecer uma experiência superior, mantendo a tradição do fumo com a facilidade e a resistência do silicone. Ideal para compartilhamento em encontros ou para uso pessoal, a escolha perfeita para qualquer apreciador exigente.\n\n* Características do produto:\n- Marca: Sessãozada\n- Quantidade: 1 Cuia\n- Dimensões: 7 x 3,5 cm', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 16:18:54', NULL, '2026-03-03 02:55:18'),
(69, 15, 'Cuia De Silicone Sessãozada: Vermelho', NULL, NULL, 'As cuias são fabricadas em silicone de alta qualidade, garantindo durabilidade, resistência e facilidade de manutenção.', 'A Cuia de Silicone Sessãozada é ideal para quem busca praticidade sem abrir mão do estilo. Cada cuia é projetada para oferecer uma experiência superior, mantendo a tradição do fumo com a facilidade e a resistência do silicone. Ideal para compartilhamento em encontros ou para uso pessoal, a escolha perfeita para qualquer apreciador exigente.\n\n* Características do produto:\n- Marca: Sessãozada\n- Quantidade: 1 Cuia\n- Dimensões: 7 x 3,5 cm', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 16:46:48', NULL, '2026-03-03 02:55:18'),
(70, 15, 'Cuia De Silicone Sessãozada: Verde Neon', NULL, NULL, ' As cuias são fabricadas em silicone de alta qualidade, garantindo durabilidade, resistência e facilidade de manutenção.', 'A Cuia de Silicone Sessãozada é ideal para quem busca praticidade sem abrir mão do estilo. Cada cuia é projetada para oferecer uma experiência superior, mantendo a tradição do fumo com a facilidade e a resistência do silicone. Ideal para compartilhamento em encontros ou para uso pessoal, a escolha perfeita para qualquer apreciador exigente.\n\n* Características do produto:\n- Marca: Sessãozada\n- Quantidade: 1 Cuia\n- Dimensões: 7 x 3,5 cm', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 16:49:26', NULL, '2026-03-03 02:55:18'),
(71, 15, 'Cuia De Silicone Sessãozada: Vermelho, Azul e Roxo', NULL, NULL, 'As cuias são fabricadas em silicone de alta qualidade, garantindo durabilidade, resistência e facilidade de manutenção.', 'A Cuia de Silicone Sessãozada é ideal para quem busca praticidade sem abrir mão do estilo. Cada cuia é projetada para oferecer uma experiência superior, mantendo a tradição do fumo com a facilidade e a resistência do silicone. Ideal para compartilhamento em encontros ou para uso pessoal, a escolha perfeita para qualquer apreciador exigente.\n\n* Características do produto:\n- Marca: Sessãozada\n- Quantidade: 1 Cuia\n- Dimensões: 7 x 3,5 cm', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 17:02:01', NULL, '2026-03-03 02:55:18'),
(72, 15, 'Cuia Silicone Bowl SquadaFum x Girls in Green: Rosa ', NULL, NULL, 'Fruto da parceria com a Girls in Green, o Silicone Bowl Squadafum é acessório indispensável na vida de qualquer fummelier.', 'Facilita o preparo, a mistura e o manuseio de sua crema, tornando o ritual de preparar sua sessão muito mais prazeroso e estiloso.Com diversas combinações de cores e novo layout, é produzido com silicone de alta qualidade, com cura de platina que evita que grude e perca a qualidade do conteúdo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Dimensões: 3,5 x 7 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 17:36:39', NULL, '2026-03-03 02:55:18'),
(73, 15, 'Cuia Silicone Bowl SquadaFum x Girls in Green: Amarelo', NULL, NULL, 'Fruto da parceria com a Girls in Green, o Silicone Bowl Squadafum é acessório indispensável na vida de qualquer fummelier.', 'Facilita o preparo, a mistura e o manuseio de sua crema, tornando o ritual de preparar sua sessão muito mais prazeroso e estiloso.Com diversas combinações de cores e novo layout, é produzido com silicone de alta qualidade, com cura de platina que evita que grude e perca a qualidade do conteúdo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Dimensões: 3,5 x 7 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 17:40:07', NULL, '2026-03-03 02:55:18'),
(74, 15, 'Cuia Silicone Bowl SquadaFum: Preto, Branco e Cinza', NULL, NULL, 'Silicone Bowl Squadafum é acessório indispensável na vida de qualquer fummelier. ', 'Facilita o preparo, a mistura e o manuseio de sua crema, tornando o ritual de preparar sua sessão muito mais prazeroso e estiloso. Com diversas combinações de cores e novo layout, é produzido com silicone de alta qualidade, com cura de platina que evita que grude e perca a qualidade do conteúdo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Dimensões: 3,8 x 7 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 17:49:49', NULL, '2026-03-03 02:55:18'),
(75, 15, 'Cuia Silicone Bowl SquadaFum: Rosa e Verde Água', NULL, NULL, 'Silicone Bowl Squadafum é acessório indispensável na vida de qualquer fummelier.', 'Facilita o preparo, a mistura e o manuseio de sua crema, tornando o ritual de preparar sua sessão muito mais prazeroso e estiloso. Com diversas combinações de cores e novo layout, é produzido com silicone de alta qualidade, com cura de platina que evita que grude e perca a qualidade do conteúdo.\n\n* Características do produto:\n- Marca: SquadaFum\n- Dimensões: 3,8 x 7 cm\n- Composição: Silicone', NULL, NULL, 30.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 17:52:42', NULL, '2026-03-03 02:55:18'),
(76, 15, 'Cuia Silicone Sadhu: Laranja', NULL, NULL, ' Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\\r\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Laranja', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:03:52', NULL, '2026-03-03 02:55:18'),
(77, 15, 'Cuia Silicone Sadhu:Amarela', NULL, NULL, ' Ótima para manuseio de misturas tendo um melhor rendimento.', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Amarela', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:08:33', NULL, '2026-03-03 02:55:18'),
(78, 15, 'Cuia Silicone Sadhu: Verde', NULL, NULL, 'Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Verde', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:11:39', NULL, '2026-03-03 02:55:18'),
(79, 15, 'Cuia Silicone Sadhu: Preta', NULL, NULL, ' Ótima para manuseio de misturas tendo um melhor rendimento.', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Preta', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:15:32', NULL, '2026-03-03 02:55:18'),
(80, 15, 'Cuia Silicone Sadhu: Vermelha', NULL, NULL, 'Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Vermelha', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:22:12', NULL, '2026-03-03 02:55:18'),
(81, 15, 'Cuia Silicone Sadhu: Roxa', NULL, NULL, 'Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Roxa', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:25:09', NULL, '2026-03-03 02:55:18'),
(82, 15, 'Cuia Silicone Sadhu: Verde-Agua', NULL, NULL, 'Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Verde-Agua', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:28:59', NULL, '2026-03-03 02:55:18'),
(83, 15, 'Cuia Silicone Sadhu: Azul-Claro', NULL, NULL, 'Ótima para manuseio de misturas tendo um melhor rendimento. ', 'Cuia Sadhu antiaderente, resistente ao fogo e água,também pode ser utilizada como cinzeiro do lado contrário.\nÓtimo material, qualidade tipo SquadaFum.\n\n* Características do produto:\n- Marca: Sadhu\n- Quantidade: 1\n- Dimensões: 7 x 3,8 cm\n- Composição: Silicone\n- Modelo:Cuia Azul-Claro', NULL, NULL, 20.00, 0.00, NULL, 'Cuia', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 18:31:04', NULL, '2026-03-03 02:55:18'),
(84, 15, 'Tubelito Porta Cigarros Papelito: Amarelo', NULL, NULL, 'Esse Tubelito é excelente para te acompanhar em todos os lugares.', 'Ele cabe no seu bolso, inibe totalmente o cheiro e tudo isso sem perda de sabor. Produto a prova d\'água e absolutamente sem cheiro.\nEsse Tubelito é excelente para te acompanhar em todos os lugares\n\n\nCaracterísticas do produto:\n- Marca: Papelito\n- Dimensões: 12 cm\n- Cores: Amarelo', NULL, NULL, 15.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 19:13:15', NULL, '2026-03-03 02:55:18'),
(85, 15, 'Tubelito Porta Cigarros Papelito: Rosa', NULL, NULL, 'Leve seu cigarro para todos os momentos sem se preocupar com o cheiro.', 'Ele cabe no seu bolso, inibe totalmente o cheiro e tudo isso sem perda de sabor. Produto a prova d\'água e absolutamente sem cheiro.\nEsse Tubelito é excelente para te acompanhar em todos os lugares\n\n\nCaracterísticas do produto:\n- Marca: Papelito\n- Dimensões: 12 cm\n- Cores: Rosa', NULL, NULL, 15.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 19:24:03', NULL, '2026-03-03 02:55:18'),
(86, 15, 'Tubelito Porta Cigarros Papelito: Verde-Neon', NULL, NULL, 'Leve seu cigarro para todos os momentos sem se preocupar com o cheiro.', 'Ele cabe no seu bolso, inibe totalmente o cheiro e tudo isso sem perda de sabor. Produto a prova d\'água e absolutamente sem cheiro.\nEsse Tubelito é excelente para te acompanhar em todos os lugares\n\n\nCaracterísticas do produto:\n- Marca: Papelito\n- Dimensões: 12 cm\n- Cores: Verde- Neon', NULL, NULL, 15.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 19:38:44', NULL, '2026-03-03 02:55:18');
INSERT INTO `products` (`id`, `store_id`, `name`, `sku`, `barcode`, `shortDescription`, `description`, `seo_title`, `seo_description`, `basePrice`, `cost_price`, `promotional_price`, `category`, `brand`, `active`, `mainImage`, `shippingType`, `shippingPrice`, `weight_kg`, `height_cm`, `width_cm`, `length_cm`, `created_at`, `published_at`, `updated_at`) VALUES
(87, 15, 'Tubelito Porta Cigarros Papelito: Laranja', NULL, NULL, 'Leve seu cigarro para todos os momentos sem se preocupar com o cheiro.', 'Ele cabe no seu bolso, inibe totalmente o cheiro e tudo isso sem perda de sabor. Produto a prova d\'água e absolutamente sem cheiro.\nEsse Tubelito é excelente para te acompanhar em todos os lugares\n\n\nCaracterísticas do produto:\n- Marca: Papelito\n- Dimensões: 12 cm\n- Cores: Laranja', NULL, NULL, 15.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 19:43:15', NULL, '2026-03-03 02:55:18'),
(88, 15, 'Mocó Big Smoke Tube Lion Rolling: Azul', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus.', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:17:06', NULL, '2026-03-03 02:55:18'),
(89, 15, 'Mocó Big Smoke Tube Lion Rolling: Rosa', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus.', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:27:44', NULL, '2026-03-03 02:55:18'),
(90, 15, 'Mocó Big Smoke Tube Lion Rolling: Laranja', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus.', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:33:37', NULL, '2026-03-03 02:55:18'),
(91, 15, 'Mocó Big Smoke Tube Lion Rolling: Amarelo', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus.', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:36:27', NULL, '2026-03-03 02:55:18'),
(92, 15, 'Mocó Big Smoke Tube Lion Rolling: Roxo', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:42:20', NULL, '2026-03-03 02:55:18'),
(93, 15, 'Mocó Big Smoke Tube Lion Rolling: Verde', NULL, NULL, 'Mocó Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Mocó Big Smoke Tube Lion Rolling Circus. Com 11,5 cm de altura e 2 cm de diâmetro, este tubo é compacto, perfeito para levar em qualquer ocasião e garante a preservação e frescura de seus conteúdos. Além de seu design moderno, ele é extremamente prático para o dia a dia, oferecendo uma solução eficaz para quem busca discrição sem abrir mão do estilo.\n\n* Características do Produto.\n- Fácil de limpar\n- Não escapa cheiro\n- Resistente ao calor\n- Resistente à água\n- Fácil de carregar no bolso ou na bolsa\n- Qualidade Lion Rolling Circus\n\nEspecificações:\n- Altura: 11,5 cm\n- Diâmetro: 2 cm\n- Material: Plástico \n\nVocê irá receber:\n01 - Mocó Big Smoke Tube Lion Rolling Circus.', NULL, NULL, 12.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 20:51:10', NULL, '2026-03-03 02:55:18'),
(94, 15, 'Mocó Tub Sadhu: Laranja', NULL, NULL, 'Mocó Sadhu é uma ótima opção, que vai tornar muito mais fácil o armazenamento e transporte dos seus cigarros. ', 'A vedação permite que você possa colocar o bolado dentro do tubo sem riscos de escapar cheiro, de modo que é possível levar até mesmo em uma mala de roupas sem riscos de contaminação com cheiros residuais.\n\n\n*Características do Mocó Sadhu:\n- Não escapa cheiro\n- Resistente à água\n- Fechamento hermético\n- Qualidade Sadhu\n\nEspecificações:\n- Comprimento: 12cm\n- Diâmetro: 1,5cm\n- Material: Plástico\n\nVocê irá receber:\n01 - Mocó Sadhu: Laranja', NULL, NULL, 10.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 21:08:00', NULL, '2026-03-03 02:55:18'),
(95, 15, 'Mocó Tub Sadhu:Preto', NULL, NULL, 'Mocó Sadhu é uma ótima opção, que vai tornar muito mais fácil o armazenamento e transporte dos seus cigarros. ', 'A vedação permite que você possa colocar o bolado dentro do tubo sem riscos de escapar cheiro, de modo que é possível levar até mesmo em uma mala de roupas sem riscos de contaminação com cheiros residuais.\n\n\n*Características do Mocó Sadhu:\n- Não escapa cheiro\n- Resistente à água\n- Fechamento hermético\n- Qualidade Sadhu\n\nEspecificações:\n- Comprimento: 12cm\n- Diâmetro: 1,5cm\n- Material: Plástico\n\nVocê irá receber:\n01 - Mocó Sadhu:', NULL, NULL, 10.00, 0.00, NULL, 'Porta Cigarro / Porta Beck', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 21:16:17', NULL, '2026-03-03 02:55:18'),
(96, 15, ' Seda De Vidro Sessãozada ', NULL, NULL, 'A seda de vidro é a solução perfeita para quando você não deseja bolar um.', 'Muito prática e você pode levar para qualquer role, sem ter que se preocupar em como vai bolar ou aonde. \nSeu tubo interno possui uma vedação de borracha apertada que permite deslizar para frente e para trás para preencher a câmara, para jogar as cinzas fora basta empurrar o tubo interno.\nTotalmente reutilizável, basta dar uma boa limpeza e irá durar para sempre.\n\n* Características do produto:\n- Marca: Sessãozada\n- Quantidade: 1 Sedas De Vidro\n- Dimensões: Seda de Vidro 8 cm \n- Composição: Vidro resistente \n- Desmontável \n- Reutilizável', NULL, NULL, 20.00, 0.00, NULL, 'Seda de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 23:05:48', NULL, '2026-03-03 02:55:18'),
(97, 15, 'Piteira De Vidro Bear Glass 6 mm', NULL, NULL, 'Piteira de Vidro Bear 6 mm projetadas para melhorar sua experiência ao fumar.', 'Com um diâmetro de 6 mm, estas piteiras oferecem um fluxo suave e fresco, filtrando impurezas sem alterar o sabor natural do seu fumo. Ideal para quem busca um upgrade em suas sessões, as piteiras de vidro Bear são duráveis, fáceis de limpar e adicionam um toque de classe à sua rotina de fumar.\n\n* Características do produto:\n- Marca: Tabear\n- Quantidade: 1 Piteira Bear Glass\n- Dimensões: 6 mm x 5 cm', NULL, NULL, 20.00, 0.00, NULL, 'Piteira de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 23:23:08', NULL, '2026-03-03 02:55:18'),
(98, 15, 'Piteira de Vidro Aleda C/ Escova de Limpeza', NULL, NULL, 'Elas vão acompanhadas de um cartãozinho que contém também uma escova de limpeza para facilitar sua viber.', 'As piteiras de vidro são o supra sumo da redução de danos. Resfriam a fumaça, retém resíduos e são laváveis e reutilizáveis.\nA Aleda desenvolveu a linha de piteiras especiais que possuem alta qualidade e durabilidade,Possuem bocal flat e dois tamanhos diferentes, sendo de 5 e 6 mm.\nAlém disso, elas vão acompanhadas de um cartãozinho que contém também uma escova de limpeza para facilitar.\n\n*Características do produto:\n- Marca: aLeda\n- Quantidade: 2 Piteiras e 1 Escova de Limpeza em cada\n- Dimensões: 6 mm x 5 cm / 5 mm x 5 cm\n- Bocal: Flat\n\n', NULL, NULL, 20.00, 0.00, NULL, 'Piteira de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 23:45:35', NULL, '2026-03-03 02:55:18'),
(99, 15, 'Piteiras de Vidro Raw 6 e 7 mm', NULL, NULL, 'Eleve sua experiência com o exclusivo Kit Raw, que apresenta duas Piteiras de Vidro em tamanhos distintos e estilos diferenciados. ', 'Com medidas de 6mm x 3,5cm no estilo Flat e 7mm x 5cm no estilo Slim, esse kit oferece opções versáteis para atender às suas preferências pessoais. A Piteira de Vidro Raw de 6mm x 3,5cm no estilo Flat proporciona uma aderência confortável e uma sensação suave aos lábios. Seu design plano é perfeito para quem busca uma experiência elegante e discreta. Além disso, o material de vidro confere uma sensação de pureza e não interfere nos sabores naturais do material.\n\n* Características da Kit com 2 Piteira de Vidro Raw 6 e 7 mm:\n- Resfria a fumaça\n- Livre de papel\n- Produzida em vidro usado em laboratório\n- Qualidade Raw\n\nEspecificações: \n- 6mm x 3,5cm - Flat\n- 7mm x 5cm - Slim\n\nVocê irá receber:\n01 - Kit com 2 Piteira de Vidro Raw 6 e 7 mm', NULL, NULL, 20.00, 0.00, NULL, 'Piteira de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-21 23:56:01', NULL, '2026-03-03 02:55:18'),
(100, 15, 'Piteira de Vidro LRV Curta', NULL, NULL, 'A Piteira de Vidro LRV Curta é perfeita para quem quer fumar com mais segurança, mas não quer uma piteira enorme.', 'Com o tamanho ideal para mudar por completo a sua sessão, a Piteira de Vidro LRV Curta é a escolha certa para usar em sedas menores, como uma seda 1 ¼. Ela é produzida inteiramente em borossilicato, o mesmo vidro utilizado ao redor do mundo como um dos mais resistentes e puros. \n\n* Características da Piteira de Vidro LRV Curta:\n- Reduz os danos\n- Mais curta\n- Estampada\n- Feita com borossilicato\n- Fácil de limpar\n- Qualidade LRV \n\nEspecificações:\n- Comprimento: 38mm\n- Diâmetro: 5mm\n- Material: Borossilicato \n\nVocê irá receber:\n01 - Piteira de Vidro LRV Curta + tubo para guardar', NULL, NULL, 10.00, 0.00, NULL, 'Piteira de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 00:12:15', NULL, '2026-03-03 02:55:18'),
(101, 15, ' Piteira de Vidro Glass Crew C/ Escova de Limpeza', NULL, NULL, 'As piteiras de vidro são o supra sumo da redução de danos. Resfriam a fumaça, retém resíduos e são laváveis e reutilizáveis. ', 'A Glass Crew desenvolveu a linha de piteiras especiais que possuem alta qualidade e durabilidade. O modelo possui bocais mistos (slim, round e flat), diferentes tamanhos para lhe atender em várias ocasiões e contam com decalque na cor Bronze, garatindo muito estilo a sua sessãozada.\nAlém disso, elas vão acompanhadas de um cartãozinho que contém também uma escova de limpeza para facilitar.\n\n* Características do produto:\n- Marca: Glass Crew\n- Quantidade: 3 Piteiras e 1 Escova de Limpeza \n- Dimensões: 4 mm x 5 cm / 5 mm x 5 cm / 5 mm x 5 cm\n', NULL, NULL, 30.00, 0.00, NULL, 'Piteira de Vidro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 00:22:24', NULL, '2026-03-03 02:55:18'),
(102, 15, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, 'O Isqueiro Maçarico Sadhu Graffiti traz estilo urbano e alta performance em um único produto.', 'Cada maçarico possui design exclusivo com estampas de graffiti, combinando arte e personalidade com praticidade no uso,são perfeitos para acendimentos rápidos e precisos. Recarregáveis e resistentes, oferecem durabilidade e segurança no dia a dia.\n\n *Características\n:-Marca: Sadhu\n-Quantidade: 10 un-Dimensões:7cm(altura) x 4cm(Largura)\n-Composição: Estireno-Acrilonitrilo\n-Modelo: Graffiti\n', NULL, NULL, 30.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 02:01:00', NULL, '2026-03-03 02:55:18'),
(103, 15, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, ' Cada maçarico possui design exclusivo com estampas de graffiti, combinando arte e personalidade com praticidade no uso.', 'Cada maçarico possui design exclusivo com estampas de graffiti, combinando arte e personalidade com praticidade no uso,são perfeitos para acendimentos rápidos e precisos. Recarregáveis e resistentes, oferecem durabilidade e segurança no dia a dia.\n\n *Características\n:-Marca: Sadhu\n-Quantidade: 10 un-Dimensões:7cm(altura) x 4cm(Largura)\n-Composição: Estireno-Acrilonitrilo\n-Modelo: Graffiti', NULL, NULL, 30.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 02:07:43', NULL, '2026-03-03 02:55:18'),
(104, 15, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, 'O Isqueiro Maçarico Sadhu Graffiti traz estilo urbano e alta performance em um único produto. Cada maçarico possui design exclusivo com estampas de graffiti.', 'Cada maçarico possui design exclusivo com estampas de graffiti, combinando arte e personalidade com praticidade no uso,são perfeitos para acendimentos rápidos e precisos. Recarregáveis e resistentes, oferecem durabilidade e segurança no dia a dia.\n\n *Características\n:-Marca: Sadhu\n-Quantidade: 10 un-Dimensões:7cm(altura) x 4cm(Largura)\n-Composição: Estireno-Acrilonitrilo\n-Modelo: Graffiti', NULL, NULL, 30.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 02:11:42', NULL, '2026-03-03 02:55:18'),
(105, 15, 'Isqueiro Maçarico Zengaz ZL: Camuflagem', NULL, NULL, 'Muito mais que um isqueiro, ele é o parceiro perfeito para quem busca estilo, praticidade e potência no dia a dia!', ' Recarregável e com acabamento emborrachado, oferece um toque macio, firme e confortável, trazendo segurança em cada uso.\nSua chama resistente ao vento garante acendimento fácil em qualquer situação — seja em aventuras ao ar livre, viagens ou nos melhores momentos com os amigos.\n\n* Características do produto:\n- Marca: Zengaz\n- Quantidade: 1 Isqueiro Maçarico\n- Dimensões: 6,5 cm\n- Modelo: Maçarico Zl-3A\n- Cores: Camuflado', NULL, NULL, 30.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 02:35:00', NULL, '2026-03-03 02:55:18'),
(106, 15, 'Isqueiro Elétrico Firestar: (Chama Azul)', NULL, NULL, 'Isqueiros Elétricos Firestar Recarregável é a escolha ideal para quem busca qualidade e eficiência. Projetados para resistir a ventos fortes', ' Com um sistema de acendimento eletrônico e aprovados em testes de alta temperatura, oferecem segurança e confiabilidade em qualquer condição. Além disso, são recarregáveis com gás butano, proporcionando um excelente custo-benefício e uma opção sustentável, Compactos e práticos.\n\n*Características do produto:\n- Recarregável\n- Aprovado em testes de alta temperatura\n- Melhor Custo Benefício\n- Acendimento eletrônico\n- Chama: Azul', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 02:57:38', NULL, '2026-03-03 02:55:18'),
(107, 15, 'Isqueiro Elétrico Firestar: (Chama Verde)', NULL, NULL, 'Projetados para resistir a ventos fortes, esses isqueiros são perfeitos para aventuras ao ar livre e situações desafiadoras.', ' Com um sistema de acendimento eletrônico e aprovados em testes de alta temperatura, oferecem segurança e confiabilidade em qualquer condição. Além disso, são recarregáveis com gás butano, proporcionando um excelente custo-benefício e uma opção sustentável, Compactos e práticos.\n\n*Características do produto:\n- Recarregável\n- Aprovado em testes de alta temperatura\n- Melhor Custo Benefício\n- Acendimento eletrônico\n- Chama: Verde', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 19:59:05', NULL, '2026-03-03 02:55:18'),
(108, 15, 'Isqueiro Elétrico Firestar: (Chama Laranja)', NULL, NULL, 'Projetados para resistir a ventos fortes, esses isqueiros são perfeitos para aventuras ao ar livre e situações desafiadoras.', 'Com um sistema de acendimento eletrônico e aprovados em testes de alta temperatura, oferecem segurança e confiabilidade em qualquer condição. Além disso, são recarregáveis com gás butano, proporcionando um excelente custo-benefício e uma opção sustentável, Compactos e práticos.\n\n*Características do produto:\n- Recarregável\n- Aprovado em testes de alta temperatura\n- Melhor Custo Benefício\n- Acendimento eletrônico\n- Chama: Laranja', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 20:01:58', NULL, '2026-03-03 02:55:18'),
(109, 15, 'Isqueiro Elétrico Firestar: (Chama Amarelo)', NULL, NULL, 'Isqueiros Elétricos Firestar Recarregável é a escolha ideal para quem busca qualidade e eficiência. Projetados para resistir a ventos fortes.', 'Com um sistema de acendimento eletrônico e aprovados em testes de alta temperatura, oferecem segurança e confiabilidade em qualquer condição. Além disso, são recarregáveis com gás butano, proporcionando um excelente custo-benefício e uma opção sustentável, Compactos e práticos.\n\n*Características do produto:\n- Recarregável\n- Aprovado em testes de alta temperatura\n- Melhor Custo Benefício\n- Acendimento eletrônico\n- Chama: Amarelo', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 20:17:47', NULL, '2026-03-03 02:55:18'),
(110, 15, 'Isqueiro Elétrico Firestar: (Chama Vermelha)', NULL, NULL, 'Isqueiros Elétricos Firestar Recarregável é a escolha ideal para quem busca qualidade e eficiência. Projetados para resistir a ventos fortes.', 'Com um sistema de acendimento eletrônico e aprovados em testes de alta temperatura, oferecem segurança e confiabilidade em qualquer condição. Além disso, são recarregáveis com gás butano, proporcionando um excelente custo-benefício e uma opção sustentável, Compactos e práticos.\n\n*Características do produto:\n- Recarregável\n- Aprovado em testes de alta temperatura\n- Melhor Custo Benefício\n- Acendimento eletrônico\n- Chama: Vermelha', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-22 20:19:37', NULL, '2026-03-03 02:55:18'),
(114, 15, 'Isqueiro Clipper Sadhu: Verde', NULL, NULL, ' Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro. ', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:19:13', NULL, '2026-03-03 02:55:18'),
(115, 15, 'Isqueiro Clipper Sadhu:Laranja', NULL, NULL, ' Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro.', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:43:22', NULL, '2026-03-03 02:55:18'),
(116, 15, 'Isqueiro Clipper Sadhu', NULL, NULL, ' Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro.', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:47:15', NULL, '2026-03-03 02:55:18'),
(117, 15, 'Isqueiro Clipper Sadhu: Preto', NULL, NULL, 'Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro.', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:49:21', NULL, '2026-03-03 02:55:18'),
(118, 15, 'Isqueiro Clipper Sadhu ', NULL, NULL, 'Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro.', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:51:05', NULL, '2026-03-03 02:55:18'),
(119, 15, 'Isqueiro Clipper Sadhu: Whiter', NULL, NULL, 'Isqueiros Clipper Sadhu é a escolha definitiva para quem valoriza estilo, funcionalidade e durabilidade em um isqueiro.', 'Cada isqueiro é recarregável, perfeita para diversas situações, desde acender cigarros até usar em atividades ao ar livre. Além disso, os Isqueiros Clipper Sadhu vêm em uma variedade de designs vibrantes e únicos, tornando-os não apenas uma ferramenta essencial.\n\n* Características do produto:\n- Marca: Clipper\n- Quantidade: 1 isqueiro \n- Dimensões: 7,5 cm\n- Modelo: Sadhu\n- Recarregável', NULL, NULL, 7.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-26 23:53:57', NULL, '2026-03-03 02:55:18'),
(120, 15, 'Isqueiro Maçarico Firestar: Verde', NULL, NULL, 'O Maçarico Firestar 2 Chamas combina segurança, eficiência e versatilidade, sendo ideal para atividades que requerem uma fonte de calor confiável.', 'Ideal para acender charutos devido ao seu gás ser inodoro.\nAlém disso, possuem 2 chamas e são recarregáveis, assim você pode usar seu isqueiro por bastante tempo.\n\n* Características do produto:\\r\n- Marca: Firestar\n- Quantidade:1 Isqueiro Maçarico\n- Dimensões: 7 cm\n- Modelo: Maçarico FS-609/2CS \n- 2 Chamas', NULL, NULL, 20.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 00:21:43', NULL, '2026-03-03 02:55:18'),
(121, 15, 'Seda Papelito King Size Brown Longa', NULL, NULL, 'A seda Papelito foi fundada em Brasilia em 2012, e uma das apostas da marca é a matéria-prima selecionada.', 'Além disso, toda a linha da Papelito apresenta textura fina, firme e maleável, o que facilita o manuseio até mesmo para os pasteleiros.A seda queima de forma lenta e uniforme, produzindo cinzas quase imperceptíveis.Ela possui um preço super em conta e uma qualidade excelente. Compre e não se arrependa.\n\n* Características do produto:\n- Marca: Papelito\n- Quantidade: Cada livreto contém 36 folhas \n- Dimensões: 130 x 44 mm\n- Modelo: King Size Brown Longa', NULL, NULL, 7.00, 0.00, NULL, 'Sedas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 13:35:37', NULL, '2026-03-03 02:55:18'),
(122, 15, 'Isqueiro Matue Bic Ez Reach: Azul', NULL, NULL, 'O Isqueiro BIC com Bico Longo,este isqueiro oferece uma solução incomparável para quem busca segurança e praticidade na hora de acender.', 'Seu bico estendido foi projetado meticulosamente para proporcionar uma experiência livre de preocupações, evitando qualquer risco de queimar os dedos durante o uso.\nAlém disso, mantendo a reputação de excelência da marca BIC, este isqueiro é construído para durar, garantindo um acendimento rápido e eficaz sempre que necessário. Não arrisque sua segurança com produtos inferiores. Escolha o Isqueiro BIC e tenha tranquilidade em cada uso.\n\n* Características do produto:\n- Marca: Bic \n- Quantidade: 1 Isqueiro \n- Dimensões: 11,5 cm (Bico: 3,7cm)\n- Modelo: Matue Ez Reach', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 13:43:13', NULL, '2026-03-03 02:55:18'),
(123, 15, 'Isqueiro Matue Bic Ez Reach: Verde', NULL, NULL, 'O Isqueiro BIC com Bico Longo. Desenvolvido com precisão e inovação para quem busca segurança e praticidade na hora de acender. ', 'Seu bico estendido foi projetado meticulosamente para proporcionar uma experiência livre de preocupações, evitando qualquer risco de queimar os dedos durante o uso.\nAlém disso, mantendo a reputação de excelência da marca BIC, este isqueiro é construído para durar, garantindo um acendimento rápido e eficaz sempre que necessário. Não arrisque sua segurança com produtos inferiores. Escolha o Isqueiro BIC e tenha tranquilidade em cada uso.\n\n* Características do produto:\n- Marca: Bic \n- Quantidade: 1 Isqueiro \n- Dimensões: 11,5 cm (Bico: 3,7cm)\n- Modelo: Matue Ez Reach', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:10:23', NULL, '2026-03-03 02:55:18'),
(124, 15, 'Isqueiro Matue Bic Ez Reach: Roxo', NULL, NULL, 'O Isqueiro BIC com Bico Longo. Desenvolvido com precisão e inovação, para quem busca segurança e praticidade na hora de acender. ', 'Seu bico estendido foi projetado meticulosamente para proporcionar uma experiência livre de preocupações, evitando qualquer risco de queimar os dedos durante o uso.\nAlém disso, mantendo a reputação de excelência da marca BIC, este isqueiro é construído para durar, garantindo um acendimento rápido e eficaz sempre que necessário. Não arrisque sua segurança com produtos inferiores. Escolha o Isqueiro BIC e tenha tranquilidade em cada uso.\n\n* Características do produto:\n- Marca: Bic \n- Quantidade: 1 Isqueiro \n- Dimensões: 11,5 cm (Bico: 3,7cm)\n- Modelo: Matue Ez Reach', NULL, NULL, 10.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:14:11', NULL, '2026-03-03 02:55:18'),
(125, 15, 'Isqueiro Maçarico Firestar: Azul Marinho', NULL, NULL, 'O Maçarico Firestar 2 Chamas combina segurança, eficiência e versatilidade, sendo ideal para atividades que requerem uma fonte de calor confiável.', 'Ideal para acender charutos devido ao seu gás ser inodoro.\nAlém disso, possuem 2 chamas e são recarregáveis, assim você pode usar seu isqueiro por bastante tempo.\n\n* Características do produto:\\r\n- Marca: Firestar\n- Quantidade:1 Isqueiro Maçarico\n- Dimensões: 7 cm\n- Modelo: Maçarico FS-609/2CS \n- 2 Chamas', NULL, NULL, 20.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:25:10', NULL, '2026-03-03 02:55:18'),
(126, 15, 'Isqueiro Maçarico Firestar: Azul ', NULL, NULL, 'O Maçarico Firestar 2 Chamas combina segurança, eficiência e versatilidade, sendo ideal para atividades que requerem uma fonte de calor confiável.', 'Ideal para acender charutos devido ao seu gás ser inodoro.\nAlém disso, possuem 2 chamas e são recarregáveis, assim você pode usar seu isqueiro por bastante tempo.\n\n* Características do produto:\\r\n- Marca: Firestar\n- Quantidade:1 Isqueiro Maçarico\n- Dimensões: 7 cm\n- Modelo: Maçarico FS-609/2CS \n- 2 Chamas', NULL, NULL, 20.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:27:04', NULL, '2026-03-03 02:55:18'),
(127, 15, 'Isqueiro Maçarico Firestar: Preto', NULL, NULL, 'O Maçarico Firestar 2 Chamas combina segurança, eficiência e versatilidade, sendo ideal para atividades que requerem uma fonte de calor confiável.', 'Ideal para acender charutos devido ao seu gás ser inodoro.\nAlém disso, possuem 2 chamas e são recarregáveis, assim você pode usar seu isqueiro por bastante tempo.\n\n* Características do produto:\\r\n- Marca: Firestar\n- Quantidade:1 Isqueiro Maçarico\n- Dimensões: 7 cm\n- Modelo: Maçarico FS-609/2CS \n- 2 Chamas', NULL, NULL, 20.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:29:07', NULL, '2026-03-03 02:55:18'),
(128, 15, 'Isqueiro Maçarico Firestar: Rosa', NULL, NULL, 'O Maçarico Firestar 2 Chamas combina segurança, eficiência e versatilidade, sendo ideal para atividades que requerem uma fonte de calor confiável.', 'Ideal para acender charutos devido ao seu gás ser inodoro.\nAlém disso, possuem 2 chamas e são recarregáveis, assim você pode usar seu isqueiro por bastante tempo.\n\n* Características do produto:\\r\n- Marca: Firestar\n- Quantidade:1 Isqueiro Maçarico\n- Dimensões: 7 cm\n- Modelo: Maçarico FS-609/2CS \n- 2 Chamas', NULL, NULL, 20.00, 0.00, NULL, 'Isqueiro / Maçarico', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 14:30:40', NULL, '2026-03-03 02:55:18'),
(129, 15, 'Shoulder Bag Puff Life Mini: Preto', NULL, NULL, 'Shoulder Bag Puff Life Mini, o modelo combina estilo e elegância com uma funcionalidade excepcional. E moderna para carregar seus acessórios essenciais.', 'Com a Shoulder Bag Puff Life Mini, você combina a praticidade do dia a dia com um toque de estilo, tornando a sua experiência ainda mais conveniente e sofisticada.\nDesign Compacto e Elegante: Este modelo é ideal para quem deseja um acessório pequeno e sofisticado, mantendo um visual elegante enquanto organiza seus itens.\n\n* Características do produto:\n- Marca: Puff Life\n- Quantidade: 1 Shoulder Bag\n- Dimensões: 17 x 11 x 5 cm', NULL, NULL, 120.00, 0.00, NULL, 'Shoulder Bag ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 15:05:02', NULL, '2026-03-03 02:55:18'),
(130, 15, 'Shoulder Bag Puff Life Mini: Rosa', NULL, NULL, 'Shoulder Bag Puff Life Mini, o modelo combina estilo e elegância com uma funcionalidade excepcional. E moderna para carregar seus acessórios essenciais.', 'Com a Shoulder Bag Puff Life Mini, você combina a praticidade do dia a dia com um toque de estilo, tornando a sua experiência ainda mais conveniente e sofisticada.\nDesign Compacto e Elegante: Este modelo é ideal para quem deseja um acessório pequeno e sofisticado, mantendo um visual elegante enquanto organiza seus itens.\n\n* Características do produto:\n- Marca: Puff Life\n- Quantidade: 1 Shoulder Bag\n- Dimensões: 17 x 11 x 5 cm', NULL, NULL, 120.00, 0.00, NULL, 'Shoulder Bag ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 15:35:32', NULL, '2026-03-03 02:55:18'),
(131, 15, 'Case Puff Life Mini:Preto', NULL, NULL, 'Conheça o Case Puff Life Mini, a solução compacta e robusta para suas necessidades diárias. Com um design que combina funcionalidade e resistência, ', 'Case Puff Life Mini é a escolha perfeita para quem busca um acessório compacto e confiável. Proteja e transporte seus itens com estilo e segurança, onde quer que você vá.\nResistência à Água: Mantenha seus itens protegidos contra a umidade com a impermeabilidade superior do case, ideal para qualquer condição climática.\nProteção Contra Odor: O material do case é projetado para bloquear odores, garantindo que seus pertences permaneçam discretos e frescos.\n\n* Características do produto:\n- Marca: Puff Life\n- Dimensões: 12 x 3,5 x 5 cm \n- Modelo: Mini\n- Material: EVA de alta qualidade e resistência', NULL, NULL, 90.00, 0.00, NULL, 'Case ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 17:10:21', NULL, '2026-03-03 02:55:18'),
(132, 15, 'Case Sessãozada Medium: Ice', NULL, NULL, 'A Case Sessãozada Medium foi criada para quem curte manter os acessórios de tabacaria sempre bem guardados e ao alcance. Compacta e resistente.', 'Fabricada em EVA de alta durabilidade revestido com tecidos de qualidade, a case oferece proteção contra impactos leves e mantém seus itens bem organizados. É perfeita para levar sedas, piteiras, isqueiros e outros acessórios do dia a dia de forma discreta e segura.\n\n* Características do produto:\n- Marca: Sessãozada\n- Dimensões: 15,5 x 10 x 3,5 cm\n- Modelo: Medium\n- Material: EVA rígido e tecidos', NULL, NULL, 50.00, 0.00, NULL, 'Case ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 17:19:31', NULL, '2026-03-03 02:55:18'),
(133, 15, 'Bolador Lion Rolling Circus King Size 110 mm', NULL, NULL, 'Se você tem dificuldade na hora de bolar ou simplesmente tem preguiça, esse bolador será indispensável para você.', 'Ele te auxilia na hora de bolar de forma muito prática e simples.\nProduzido com qualidade Lion Rolling Circus, os boladores vem com uma lona extra pra você substituir caso precise. \n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Bolador\n- Dimensões: 110 mm\n- Modelo: King Size', NULL, NULL, 30.00, 0.00, NULL, 'bolador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 17:25:35', NULL, '2026-03-03 02:55:18'),
(134, 15, 'Gás Butano Bullfire XL Volcano Para Recarregar Isqueiro 600ml', NULL, NULL, 'Gás Butano Bullfire XL Volcano Para Recarregar Isqueiro 600ml, Gás Butano Bullfire XL da Volcano é um gás ideal para recarregar isqueiros e maçaricos de todos os tipos. ', 'A lata é equipada com 5 bicos diferentes para diferentes isqueiros. A lata contém 600 ml de gás butano puro. Numa composição de Nor-Butano, Iso-Butano e Propano, o que confere estabilidade e maior durabilidade ao produto.\nO Gás possuí possui um processo de filtração a frio não possuindo aditivo de odor garantindo pureza e prolongamento da vida útil do isqueiro. Esse produto é ideal para extrações, solda culinária etc.\n\n* Características do produto:\n- Marca: Volcano\n- Quantidade: 1 Gás com 600ml \n- Dimensões: 28 cm', NULL, NULL, 55.00, 0.00, NULL, 'Acessórios para Isqueiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 17:33:40', NULL, '2026-03-03 02:55:18'),
(135, 15, 'Pedra Para Isqueiro Moon C/6 Cada', NULL, NULL, 'Pedra Para Isqueiro Pra te ajuda a econimizar seu isqueiro na hora da troca.', 'Agora você pode trocar as pedras de seu isqueiro quando estragarem, fazendo-o durar para sempre.\n\n * Características do produto:\n- Marca: Moon\n- Quantidade: 1 Peças C/6 Pedras\n- Serve nos isqueiros, ZIPPO, CLIPPER, e todos isqueiros com troca de pedra.', NULL, NULL, 15.00, 0.00, NULL, 'Acessórios para Isqueiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 17:43:00', NULL, '2026-03-03 02:55:18'),
(136, 15, ' Balança de Precisão 500 g x 0.1 g', NULL, NULL, 'Mini balança de bolso oferece para você praticidade e qualidade, sendo possível carrega-la em bolsas, mochilas e até mesmo no seu bolso.', 'Possui alta qualidade, garantindo precisão durante as pesagens!\\rIndicado para uso profissional em farmácias, laboratórios, joalherias, entre outros.\n\n* Características do produto:\n- Marca: Pocket Scale\n- Graduação: 0,1g\n- Pesagem: Grama (g) , Quilate (ct) , Grão (gn) , Onça(oz)\n- Capacidade máxima: 500g\n- Display em cristal liquido iluminado\n- Botão de liga/desliga\n- Tampa protetora em acrílico\n- Base de peso em aço inox\n- Alimentação: 2 pilhas AAA\n- Possui indicador de bateria fraca\n- Plataforma de pesagem: 5,5 x 5 cm\n- Bateria de Brinde', NULL, NULL, 50.00, 0.00, NULL, 'Balança ', NULL, 1, 1, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 18:33:26', NULL, '2026-03-03 02:55:18'),
(137, 15, 'Case G To Na Bê Colors Model:Verde - Mago', NULL, NULL, 'Leve seu ritual com estilo e organização com o Case G To Na Bê Color! Compacto por fora, espaçoso por dentro.', 'Com um design vibrante e descolado, o case tem acabamento resistente e interior bem dividido, ideal pra manter seus itens organizados e longe de bagunça. Perfeito pra quem curte discrição sem abrir mão da personalidade. \nele foi pensado especialmente pra quem curte praticidade na hora de montar o kit completo. Cabe tudo o que você precisa: dichavador, bolador, sedas, piteiras, isqueiro e mais, tudo no lugar.\n\n* Características do produto:\n- Marca: To Na Bê\n- Dimensões: 15 x 9,5 cm\n- Modelo: G', NULL, NULL, 50.00, 0.00, NULL, 'Case ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 18:39:49', NULL, '2026-03-03 02:55:18'),
(138, 15, 'Pochetão Shoulder Bag Raw Brazil Preto', NULL, NULL, 'A Pochetão Shoulder Bag Raw Brazil Preto é a combinação perfeita de praticidade e estilo. Fabricada em 100% poliéster, oferece resistência e durabilidade.', 'Seu design funcional conta com 3 bolsos com fecho para organizar seus itens com facilidade. \nO bolso principal central garante amplo espaço, enquanto o bolso frontal é equipado com redes de compartimentos, proporcionando organização adicional para seus acessórios. Para completar, há um bolso menor, ideal para itens pequenos e de fácil acesso. Perfeita para quem busca conveniência e estilo no dia a dia.\n\n* Características do produto:\n- Marca: Raw\n- Quantidade: 1 Shoulder Bag\n- Dimensões: 36 x 23 cm\n- Modelo: Pochetão\n- Alça Ajustável', NULL, NULL, 130.00, 0.00, NULL, 'Shoulder Bag ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 18:44:10', NULL, '2026-03-03 02:55:18'),
(139, 15, 'Case Sessãozada Medium Model:Ostentação', NULL, NULL, ' A Case Sessãozada Medium foi criada para quem curte manter os acessórios de tabacaria sempre bem guardados e ao alcance.', 'Compacta e resistente, ela é ideal para acompanhar suas sessões,abricada em EVA de alta durabilidade revestido com tecidos de qualidade, a case oferece proteção contra impactos leves e mantém seus itens bem organizados. \nÉ perfeita para levar sedas, piteiras, isqueiros e outros acessórios do dia a dia de forma discreta e segura.\n\n\n* Características do produto:\n- Marca: Sessãozada\n- Dimensões: 15,5 x 10 x 3,5 cm\n- Modelo: Medium\n- Material: EVA rígido e tecidos', NULL, NULL, 50.00, 0.00, NULL, 'Case ', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 18:54:12', NULL, '2026-03-03 02:55:18'),
(140, 15, 'Dichavador de Metal 3 Partes Artistic Lips', NULL, NULL, 'Incrível dichavador que une estilo e diversão para elevar suas sessões a um novo patamar, é mais do que um acessório funcional.', 'Além disso, conta com reservatório, coletor de kief e fechamento magnético garantindo maior segurança durante o manuseio.\nE uma expressão de criatividade e vivacidade. Cada cor vibrante é cuidadosamente escolhida para criar um visual envolvente e cheio de personalidade.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Dichavador\n- Dimensões: 5 x 2,5 cm\n- Composição: Metal', NULL, NULL, 75.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 19:10:14', NULL, '2026-03-03 02:55:18'),
(141, 15, 'Dichavador De Metal 4 Partes Medio: Alien ', NULL, NULL, 'O Dichavador de Metal 4 Partes Alien é a combinação perfeita entre estilo e funcionalidade.', 'Com um design imponente e detalhado, ele traz o visual alienígena em alto relevo, ideal para quem busca um toque de originalidade. \nSeu fechamento magnético oferece maior praticidade e segurança durante o uso, garantindo que as partes fiquem firmemente unidas. \n\n* Características do produto:\n- Quantidade: 1 Dichavador\n- Dimensões: 5 (diâmetro) x 3,5 cm (altura)\n- 4 Partes \n- Material: Metal\n\n', NULL, NULL, 50.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'free', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 19:21:58', NULL, '2026-03-03 02:55:18'),
(142, 15, 'Dichavador de Metal 4 Partes Grande: Full Folha ', NULL, NULL, 'O Dichavador Full Folha combina elementos distintos de caveiras e folhas, criando uma estética intrigante, mais do que apenas uma ferramenta de trituração - é uma obra de arte funcional.', 'presenta um design impressionante que combina a icônica imagem da caveira com delicadas folhas. Este contraste entre o sombrio e o natural cria uma estética fascinante que atrai os olhares e provoca a imaginação.\nComposto por quatro partes distintas, este dichavador garante uma trituração eficiente e uniforme de suas ervas, além de contar com colector de kief e pázinha. Conta também com imã, garantindo maior segurança durante o manuseio.\n\n Características do produto:\n- Marca: Abduzido\n- Quantidade: 1 Dichavador\n- Dimensões: 60 x 40 mm\n- 4 Partes\n- Material: Metal', NULL, NULL, 100.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 19:27:43', NULL, '2026-03-03 02:55:18'),
(143, 15, 'Dichavador De Metal 4 Partes Médio: Simpsons ', NULL, NULL, 'Dichavador produzido em metal de alta durabilidade, conta também com um imã central para manter-se fechado, garantindo maior segurança.', 'Dichavador De Metal 4 Partes Simpsons Médio, modelo conta com diversas estampas colecionáveis de um dos desenhos mais amado pela galera, Os Simpsons, unindo a cultura geek ao universo da tabacaria.\n\n* Características do produto:\\r\n- Dimensões: 4 (diâmetro) x 3,5 cm (altura)\n- Composição: Metal\n- Modelo: 4 Partes Médio', NULL, NULL, 50.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 19:34:40', NULL, '2026-03-03 02:55:18'),
(145, 15, 'Dichavador de Metal 3 Partes Grande: Na Boa Gold', NULL, NULL, 'Dichavador com um design elegante, garantindo estilo ao seu ritual, além de praticidade e funcionalidade.', 'Dichavador a manivela, com esse modelo não terá mais aquele problema do dichavador,Resistentes, práticos, duráveis e com fechamento magnético que garante uma melhor segurança na hora de dichavar. Além disso, acompanha pázinha, coletor de kief e um reservatório para guardar sua erva.\n\n* Características do produto:\n- Marca: Na Boa\n- Quantidade: 1 Dichavador\n- Dimensões: 5 x 3,5 cm\n- Composição: Metal\n- Modelo: Gold ', NULL, NULL, 90.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:11:50', NULL, '2026-03-03 02:55:18'),
(146, 15, 'Cinzeiro de Vidro To Na Bê Redondo: SharkCrazy', NULL, NULL, 'Cinzeiro de Vidro ', 'Com design redondo e fabricado em vidro ultra resistente, este cinzeiro é ideal para bares, áreas de lazer ou uso pessoal. \nSeu tamanho compacto de 8,5cm x 3cm oferece praticidade sem abrir mão da sofisticação. Material: Vidro de alta resistência, design moderno e temático, fácil de limpar.\n\n* Características do produto: \n- Composição: Vidro\n- Medidas: 3 (altura) x 8,5 cm (diâmetro)\n- Quantidade: 1 Unidade\n\n', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:20:51', NULL, '2026-03-03 02:55:18'),
(147, 15, 'Cinzeiro de Vidro To Na Bê: Gangster', NULL, NULL, 'Cinzeiro de Vidro \"Tô Na Bê\" Redondo – Ultra Resistente (9cm x 9cm),Desfrute de estilo e durabilidade com o Cinzeiro de Vidro', 'Com design redondo e fabricado em vidro ultra resistente, este cinzeiro é ideal para bares, áreas de lazer ou uso pessoal. \nSeu tamanho compacto de 8,5cm x 3cm oferece praticidade sem abrir mão da sofisticação. Material: Vidro de alta resistência, design moderno e temático, fácil de limpar.\n\n* Características do produto: \n- Composição: Vidro\n- Medidas: 3 (altura) x 8,5 cm (diâmetro)\n- Quantidade: 1 Unidade', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:37:26', NULL, '2026-03-03 02:55:18'),
(148, 15, 'Cinzeiro de Vidro To Na Bê Redondo', NULL, NULL, 'Cinzeiro de Vidro \"Tô Na Bê\" Redondo – Ultra Resistente (9cm x 9cm),Desfrute de estilo e durabilidade com o Cinzeiro de Vidro.', 'Com design redondo e fabricado em vidro ultra resistente, este cinzeiro é ideal para bares, áreas de lazer ou uso pessoal. \nSeu tamanho compacto de 8,5cm x 3cm oferece praticidade sem abrir mão da sofisticação. Material: Vidro de alta resistência, design moderno e temático, fácil de limpar.\n\n* Características do produto: \n- Composição: Vidro\n- Medidas: 3 (altura) x 8,5 cm (diâmetro)\n- Quantidade: 1 Unidade\n', NULL, NULL, 34.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:39:19', NULL, '2026-03-03 02:55:18'),
(149, 15, 'Cinzeiro de Vidro To Na Bê Redondo: Snake', NULL, NULL, 'Cinzeiro de Vidro \"Tô Na Bê\" Redondo – Ultra Resistente (9cm x 9cm),Desfrute de estilo e durabilidade com o Cinzeiro de Vidro', 'Com design redondo e fabricado em vidro ultra resistente, este cinzeiro é ideal para bares, áreas de lazer ou uso pessoal. \nSeu tamanho compacto de 8,5cm x 3cm oferece praticidade sem abrir mão da sofisticação. Material: Vidro de alta resistência, design moderno e temático, fácil de limpar.\n\n* Características do produto: \n- Composição: Vidro\n- Medidas: 3 (altura) x 8,5 cm (diâmetro)\n- Quantidade: 1 Unidade', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:41:41', NULL, '2026-03-03 02:55:18'),
(150, 15, 'Cinzeiro de Vidro To Na Bê Redondo: Hype', NULL, NULL, 'Cinzeiro de Vidro \"Tô Na Bê\" Redondo – Ultra Resistente (9cm x 9cm),Desfrute de estilo e durabilidade com o Cinzeiro de Vidro', 'Com design redondo e fabricado em vidro ultra resistente, este cinzeiro é ideal para bares, áreas de lazer ou uso pessoal. \nSeu tamanho compacto de 8,5cm x 3cm oferece praticidade sem abrir mão da sofisticação. Material: Vidro de alta resistência, design moderno e temático, fácil de limpar.\n\n* Características do produto: \n- Composição: Vidro\n- Medidas: 3 (altura) x 8,5 cm (diâmetro)\n- Quantidade: 1 Unidade', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 20:43:44', NULL, '2026-03-03 02:55:18');
INSERT INTO `products` (`id`, `store_id`, `name`, `sku`, `barcode`, `shortDescription`, `description`, `seo_title`, `seo_description`, `basePrice`, `cost_price`, `promotional_price`, `category`, `brand`, `active`, `mainImage`, `shippingType`, `shippingPrice`, `weight_kg`, `height_cm`, `width_cm`, `length_cm`, `created_at`, `published_at`, `updated_at`) VALUES
(151, 15, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, 'Os cinzeiros de metal da Lion Rolling Circus é a novidade que faltava no seu kit.', 'Com os personagens exclusivos e colecionáveis da marca, os cinzeiros possuem impressão e material de alta qualidade, além disso, são de alta resistência a temperaturas. A experiência da sua sessão é pensada até as cinzas.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Dimensões: 13 x 2 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:07:14', NULL, '2026-03-03 02:55:18'),
(152, 15, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, 'Os cinzeiros de metal da Lion Rolling Circus é a novidade que faltava no seu kit.', 'Com os personagens exclusivos e colecionáveis da marca, os cinzeiros possuem impressão e material de alta qualidade, além disso, são de alta resistência a temperaturas. A experiência da sua sessão é pensada até as cinzas.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Dimensões: 13 x 2 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:09:11', NULL, '2026-03-03 02:55:18'),
(153, 15, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, 'Os cinzeiros de metal da Lion Rolling Circus é a novidade que faltava no seu kit.', 'Com os personagens exclusivos e colecionáveis da marca, os cinzeiros possuem impressão e material de alta qualidade, além disso, são de alta resistência a temperaturas. A experiência da sua sessão é pensada até as cinzas.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Dimensões: 13 x 2 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:11:36', NULL, '2026-03-03 02:55:18'),
(154, 15, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, 'Os cinzeiros de metal da Lion Rolling Circus é a novidade que faltava no seu kit.', 'Com os personagens exclusivos e colecionáveis da marca, os cinzeiros possuem impressão e material de alta qualidade, além disso, são de alta resistência a temperaturas. A experiência da sua sessão é pensada até as cinzas.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Dimensões: 13 x 2 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:13:31', NULL, '2026-03-03 02:55:18'),
(155, 15, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, 'Os cinzeiros de metal da Lion Rolling Circus é a novidade que faltava no seu kit.', 'Com os personagens exclusivos e colecionáveis da marca, os cinzeiros possuem impressão e material de alta qualidade, além disso, são de alta resistência a temperaturas. A experiência da sua sessão é pensada até as cinzas.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Dimensões: 13 x 2 cm\n- Composição: Metal', NULL, NULL, 35.00, 0.00, NULL, ' Cinzeiro', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:16:06', NULL, '2026-03-03 02:55:18'),
(156, 15, 'Dichavador de Acrílico Lion Rolling ', NULL, NULL, 'A Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Pensando nisso desenvolveram os incríveis dichavadores de acrílico de 3 partes, com dentes afiados e reservatório para guardar seu fumo.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Dichavador\n- Dimensões: 6 x 2,5 cm\n- Composição: Acrílico \n- Modelo: 3 Partes', NULL, NULL, 30.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:27:53', NULL, '2026-03-03 02:55:18'),
(157, 15, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, 'A Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Pensando nisso desenvolveram os incríveis dichavadores de acrílico de 3 partes, com dentes afiados e reservatório para guardar seu fumo.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Dichavador\n- Dimensões: 6 x 2,5 cm\n- Composição: Acrílico \n- Modelo: 3 Partes', NULL, NULL, 30.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:36:57', NULL, '2026-03-03 02:55:18'),
(158, 15, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, 'A Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Pensando nisso desenvolveram os incríveis dichavadores de acrílico de 3 partes, com dentes afiados e reservatório para guardar seu fumo.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Dichavador\n- Dimensões: 6 x 2,5 cm\n- Composição: Acrílico \n- Modelo: 3 Partes', NULL, NULL, 30.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 21:41:55', NULL, '2026-03-03 02:55:18'),
(159, 15, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, 'A Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Pensando nisso desenvolveram os incríveis dichavadores de acrílico de 3 partes, com dentes afiados e reservatório para guardar seu fumo.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Dichavador\n- Dimensões: 6 x 2,5 cm\n- Composição: Acrílico \n- Modelo: 3 Partes', NULL, NULL, 30.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 22:32:53', NULL, '2026-03-03 02:55:18'),
(160, 15, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, 'A Lion Rolling Circus busca levar sua experiência de fumo para outro nível, com produtos de qualidade, funcionais e lindos.', 'Pensando nisso desenvolveram os incríveis dichavadores de acrílico de 3 partes, com dentes afiados e reservatório para guardar seu fumo.\n\n* Características do produto:\n- Marca: Lion Rolling Circus\n- Quantidade: 1 Dichavador\n- Dimensões: 6 x 2,5 cm\n- Composição: Acrílico \n- Modelo: 3 Partes', NULL, NULL, 30.00, 0.00, NULL, 'Dichavador', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 22:34:44', NULL, '2026-03-03 02:55:18'),
(161, 15, 'Bandeja De Metal Box Sadhu Model:Alquimista', NULL, NULL, 'A Sadhu está lançando um modelo inovador de bandejas em metal e formato \"box\" que permite guardar e organizar acessórios na parte interna.', 'A \"tampa bandeja\" ainda tem um compartimento para apoiar seu enrolado depois de pronto.\nAs bandejas vêm com saquinhos multiuso que são resistentes à água!\n\n* Características do produto:\n- Marca: Sadhu\n- Dimensões: 20,5 x 14,5 x 2,9 cm/ Profundidade bandeja: 1 cm\n- Composição: Metal\n- Modelo: Box\n\n', NULL, NULL, 55.00, 0.00, NULL, 'Bandejas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 22:42:45', NULL, '2026-03-03 02:55:18'),
(162, 15, 'Bandeja De Metal Box Sadhu Model:Shiva', NULL, NULL, 'A Sadhu está lançando um modelo inovador de bandejas em metal e formato \"box\" que permite guardar e organizar acessórios na parte interna.', 'A \"tampa bandeja\" ainda tem um compartimento para apoiar seu enrolado depois de pronto.\nAs bandejas vêm com saquinhos multiuso que são resistentes à água!\n\n* Características do produto:\n- Marca: Sadhu\n- Dimensões: 20,5 x 14,5 x 2,9 cm/ Profundidade bandeja: 1 cm\n- Composição: Metal\n- Modelo: Box', NULL, NULL, 55.00, 0.00, NULL, 'Bandejas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 22:46:22', NULL, '2026-03-03 02:55:18'),
(163, 15, 'Bandeja De Metal Média: UTHC', NULL, NULL, 'Deixe seu cantinho mais que especial com essas incríveis bandejas', 'Material resistente de alta qualidade e fácil de limpar.\n\n* Características do produto:\n- Marca: Universo THC\n- Dimensões: 18 x 14 x 2 cm\n- Material: Metal', NULL, NULL, 40.00, 0.00, NULL, 'Bandejas', NULL, 1, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-27 23:46:44', NULL, '2026-03-03 02:55:18'),
(164, 15, 'Bandeja Metal Média com Divisória ', NULL, NULL, 'Material resistente de alta qualidade e fácil de limpar.', 'Evite o desperdício na hora de enrolar o seu tabaco com essa belíssima bandeja estampada.\nDeixe seu cantinho mais que especial com essa incríveis bandeja.\n\n\n* Características do produto:\n- Marca: Tokahauu - Happy 420\n- Dimensões: 23 x 15 cm \\r\n- Material: Metal - Média', NULL, NULL, 40.00, 0.00, NULL, 'Bandejas', NULL, 0, 0, 'calculated', 0.00, NULL, NULL, NULL, NULL, '2026-01-28 00:00:54', NULL, '2026-03-03 02:55:18'),
(165, 56, 'Perfume masculino 212 Vip Black Carolina Herrera', NULL, NULL, '212 Vip Black Carolina Herrera - Perfume Masculino Eau de Parfum - 200Ml, Carolina Herrera, 200', '212 Vip Black Carolina Herrera - Perfume Masculino Eau de Parfum - 200Ml, Carolina Herrera, 200 Os pontos pulsantes mais populares para passar perfume são a base do pescoço, os pulsos e atrás da orelha.', NULL, NULL, 599.00, 0.00, NULL, 'Categoria Teste', NULL, 1, 0, 'fixo', 0.00, NULL, NULL, NULL, NULL, '2026-02-22 16:16:35', NULL, '2026-03-03 18:09:59'),
(166, 15, 'teste', NULL, NULL, 'ewwewwe', 'eweweweweew', NULL, NULL, 23.00, 0.00, NULL, 'bolador', NULL, 1, 0, 'melhor_envio', 0.00, NULL, NULL, NULL, NULL, '2026-03-03 09:02:39', NULL, '2026-03-03 06:02:39');

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_url` text NOT NULL,
  `image_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `image_order`) VALUES
(6, 4, './uploads/img_696e3b6fde58c1.53613022.jpg', 0),
(7, 4, './uploads/img_696e3b70ab6c24.37978224.jpg', 1),
(8, 4, './uploads/img_696e3b718eecb8.60093916.jpg', 2),
(9, 5, './uploads/img_696e4316319636.11464303.webp', 0),
(10, 5, './uploads/img_696e431648cb11.29648047.webp', 1),
(11, 6, './uploads/img_696e457e3ec869.90277309.webp', 0),
(12, 6, './uploads/img_696e457e5d2a51.81769931.webp', 1),
(13, 7, './uploads/img_696e4f89d98ad3.92209162.jpeg', 0),
(14, 7, './uploads/img_696e4f8ab8af51.53532570.jpeg', 1),
(15, 7, './uploads/img_696e4f8bd94463.68147697.jpeg', 2),
(16, 8, './uploads/img_696e516fefa7c6.38072826.jpeg', 0),
(17, 8, './uploads/img_696e51712f8bb8.33628298.jpeg', 1),
(18, 8, './uploads/img_696e5171e8afb8.09104926.jpeg', 2),
(19, 9, './uploads/img_696e541406ddc6.86240241.jpeg', 0),
(20, 9, './uploads/img_696e54142b0bd3.12265412.webp', 1),
(21, 10, './uploads/img_696e56430c8c55.25987519.jpeg', 0),
(22, 10, './uploads/img_696e5643985980.00322707.jpeg', 1),
(23, 11, './uploads/img_696e57d0de4169.48838057.jpeg', 0),
(24, 11, './uploads/img_696e57d256a034.44865267.jpeg', 1),
(25, 11, './uploads/img_696e57d3ce1d58.86988827.jpeg', 2),
(26, 12, './uploads/img_696e5a157ee0f9.10803215.jpeg', 0),
(27, 12, './uploads/img_696e5a16911c80.80589084.jpeg', 1),
(28, 12, './uploads/img_696e5a17498cd4.43752692.jpeg', 2),
(29, 13, './uploads/img_696e5c17b6e580.53637960.jpeg', 0),
(30, 14, './uploads/img_696e5e4c3f4155.22539179.jpeg', 0),
(31, 14, './uploads/img_696e5e4e1ff1d6.07591600.jpeg', 1),
(32, 14, './uploads/img_696e5e4fe45656.76243639.jpeg', 2),
(33, 15, './uploads/img_696e5fce66ecf2.71396858.jpeg', 0),
(34, 15, './uploads/img_696e5fcfc16921.70350159.jpeg', 1),
(35, 15, './uploads/img_696e5fd27763a1.40848958.jpeg', 2),
(36, 16, './uploads/img_696e6310d48034.78994595.jpeg', 0),
(37, 16, './uploads/img_696e63167e8008.39009046.jpeg', 1),
(38, 16, './uploads/img_696e6320172f80.99018528.jpeg', 2),
(39, 17, './uploads/img_696e653e9bb703.78729382.jpeg', 0),
(40, 17, './uploads/img_696e65400e4665.58879755.jpeg', 1),
(44, 19, './uploads/img_696e6cce239927.30245770.jpeg', 0),
(45, 19, './uploads/img_696e6cce965814.77981188.jpeg', 1),
(49, 21, './uploads/img_696e7ab1485378.60388575.jpeg', 0),
(50, 21, './uploads/img_696e7ab17d0471.50347853.jpeg', 1),
(51, 21, './uploads/img_696e7ab1ab1910.06226081.jpeg', 2),
(52, 21, './uploads/img_696e7ab1d30777.38846249.jpeg', 3),
(56, 22, './uploads/img_696e7ec23cb9a6.97486813.webp', 0),
(57, 22, './uploads/img_696e7fd69046c4.69370241.webp', 1),
(58, 22, './uploads/img_696e7fd6ae5cc1.05809058.webp', 2),
(59, 22, './uploads/img_696e7fd6c62fd5.08575351.webp', 3),
(60, 22, './uploads/img_696e7fd6de4e51.87670077.webp', 4),
(61, 22, './uploads/img_696e7fd7004c64.07080298.webp', 5),
(62, 22, './uploads/img_696e7fd7165a03.70517231.webp', 6),
(66, 23, './uploads/img_696e81fb383382.50566565.webp', 0),
(67, 23, './uploads/img_696e81fb752f14.60471368.jpeg', 1),
(70, 24, './uploads/img_696e90db956422.25219143.jpeg', 0),
(71, 24, './uploads/img_696e90e07c6f77.95352996.jpeg', 1),
(72, 20, './uploads/img_696e78f4df6091.48858601.jpeg', 0),
(73, 20, './uploads/img_696e78f50fb354.25178016.jpeg', 1),
(74, 20, './uploads/img_696e78f535ff69.48804780.jpeg', 2),
(75, 25, './uploads/img_696e92c2c209c9.31433783.jpg', 0),
(76, 26, './uploads/img_696e9475beade4.85252616.jpeg', 0),
(77, 26, './uploads/img_696e9476766290.95751129.jpeg', 1),
(78, 27, './uploads/img_696e95ca976607.72475728.jpeg', 0),
(79, 27, './uploads/img_696e95cbb08ab6.16057152.jpeg', 1),
(80, 28, './uploads/img_696e9700558109.42212894.jpeg', 0),
(81, 28, './uploads/img_696e97042f3515.19695456.jpeg', 1),
(87, 31, './uploads/img_696fbf02ea5064.06204491.jpeg', 0),
(88, 31, './uploads/img_696fbf03103c02.44524033.jpeg', 1),
(89, 32, './uploads/img_696fc2ce4a5811.78457004.jpeg', 0),
(90, 32, './uploads/img_696fc2cea8a4a5.43567470.jpeg', 1),
(91, 33, './uploads/img_696fc3e88328a3.75593484.jpeg', 0),
(92, 33, './uploads/img_696fc3e90598a3.22521758.jpeg', 1),
(93, 34, './uploads/img_696fc675b867c6.20381064.jpeg', 0),
(94, 34, './uploads/img_696fc6762bf278.94484162.jpeg', 1),
(95, 35, './uploads/img_696feb706fa715.55452105.jpeg', 0),
(96, 35, './uploads/img_696feb70debba2.81613124.jpeg', 1),
(99, 37, './uploads/img_696ff0423e4cd6.08176823.jpeg', 0),
(100, 37, './uploads/img_696ff0439c3c84.98326839.jpeg', 1),
(101, 37, './uploads/img_696ff044761712.20617930.jpeg', 2),
(102, 37, './uploads/img_696ff045be7592.68655255.jpeg', 3),
(103, 38, './uploads/img_696ff596cc0819.90149407.jpeg', 0),
(104, 38, './uploads/img_696ff5974daf74.69592605.jpeg', 1),
(105, 38, './uploads/img_696ff5989ce399.34841040.jpeg', 2),
(106, 38, './uploads/img_696ff5a992a526.97690240.jpeg', 3),
(107, 39, './uploads/img_696ff7a9f12431.72275080.jpeg', 0),
(108, 39, './uploads/img_696ff7c9680a54.79730386.jpeg', 1),
(109, 39, './uploads/img_696ff7cee54466.19692797.jpeg', 2),
(110, 39, './uploads/img_696ff7d407f2e7.85345779.jpeg', 3),
(116, 40, './uploads/img_696ff8e7447382.44364466.jpeg', 0),
(117, 40, './uploads/img_696ff8f273b868.58984037.jpeg', 1),
(118, 40, './uploads/img_696ff8f70989f0.61928633.jpeg', 2),
(119, 40, './uploads/img_696ff8f92491c7.61395192.jpeg', 3),
(120, 42, './uploads/img_697020e87c55a4.84407002.jpeg', 0),
(121, 42, './uploads/img_697020f0a7e886.18707570.jpeg', 1),
(122, 42, './uploads/img_697020f3940309.59772524.jpeg', 2),
(123, 43, './uploads/img_697025d39ba243.03344679.jpeg', 0),
(124, 43, './uploads/img_697025ef194576.84602802.jpeg', 1),
(125, 43, './uploads/img_697025f2a31830.90169064.jpeg', 2),
(126, 44, './uploads/img_6970278fa88a78.16001957.jpeg', 0),
(127, 44, './uploads/img_69702791cdfbd4.89812086.jpeg', 1),
(129, 45, './uploads/img_697028f5c39a00.04568002.jpeg', 0),
(130, 45, './uploads/img_697028f9049ee4.01510621.jpeg', 1),
(131, 46, './uploads/img_69702c082d4ee2.22142705.jpeg', 0),
(132, 46, './uploads/img_69702c0ed89623.88572936.jpeg', 1),
(133, 47, './uploads/img_69702cda46ea18.94900138.jpeg', 0),
(134, 47, './uploads/img_69702cdd7dc898.75654268.jpeg', 1),
(139, 49, './uploads/img_697032ae87b311.46080288.jpeg', 0),
(140, 49, './uploads/img_697032af8a7292.18116113.jpeg', 1),
(143, 50, './uploads/img_69703401d5d448.22341590.jpeg', 0),
(144, 50, './uploads/img_6970340759ba47.47416842.jpeg', 1),
(147, 52, './uploads/img_697035bfe68803.48818432.jpeg', 0),
(148, 52, './uploads/img_697035c816f393.26104602.jpeg', 1),
(149, 52, './uploads/img_697035cb96fa16.28594775.jpeg', 2),
(151, 53, './uploads/img_69703a06ef28c6.09680083.jpeg', 0),
(152, 53, './uploads/img_69703a0a1baa33.98151873.jpeg', 1),
(153, 54, './uploads/img_69703ad63b7761.67847783.jpeg', 0),
(154, 54, './uploads/img_69703ad92995c3.36056402.jpeg', 1),
(156, 55, './uploads/img_69703b96785bd9.41337260.jpeg', 0),
(157, 55, './uploads/img_69703b998e6b98.04847305.jpeg', 1),
(158, 56, './uploads/img_69703e11423434.74171788.jpeg', 0),
(159, 56, './uploads/img_69703e345f8733.84484353.jpeg', 1),
(160, 56, './uploads/img_69703e37654279.90332936.jpeg', 2),
(161, 57, './uploads/img_69703ec9531ce2.53819527.jpeg', 0),
(162, 57, './uploads/img_69703ed6e2c718.55490863.jpeg', 1),
(163, 58, './uploads/img_697041d00a2a78.64000190.jpeg', 0),
(164, 58, './uploads/img_697041d5e59252.54104166.jpeg', 1),
(165, 48, './uploads/img_69703032db31a5.09798543.jpeg', 0),
(166, 48, './uploads/img_69703039d95ff1.50859858.jpeg', 1),
(167, 48, './uploads/img_6970303ee66dc8.11698715.jpeg', 2),
(168, 59, './uploads/img_6970546b2a3817.66937704.jpeg', 0),
(169, 59, './uploads/img_6970546dea26c9.05521341.jpeg', 1),
(170, 59, './uploads/img_697054711ff545.33106062.jpeg', 2),
(171, 60, './uploads/img_69705822e2a8c2.78265672.jpeg', 0),
(172, 60, './uploads/img_697058256859c1.64702337.jpeg', 1),
(173, 61, './uploads/img_697058bb08e3d3.14677744.jpeg', 0),
(174, 61, './uploads/img_697058c11ebb53.75419440.jpeg', 1),
(175, 62, './uploads/img_69705a23714597.43076714.jpeg', 0),
(176, 62, './uploads/img_69705a28971b96.97605541.jpeg', 1),
(177, 62, './uploads/img_69705a2b5b2136.07025114.jpeg', 2),
(178, 63, './uploads/img_69705b7b43bb56.67178493.jpeg', 0),
(179, 63, './uploads/img_69705b805eccf9.17902870.jpeg', 1),
(180, 63, './uploads/img_69705b867c3cf4.33946090.jpeg', 2),
(181, 64, './uploads/img_69705e2d2082d6.42461589.jpeg', 0),
(182, 64, './uploads/img_69705e3446afc5.45733926.jpeg', 1),
(183, 65, './uploads/img_697062d1474201.25337327.jpg', 0),
(184, 65, './uploads/img_697062daeb20c3.64126323.jpg', 1),
(197, 69, './uploads/img_697102e1828ee4.35157330.jpeg', 0),
(198, 69, './uploads/img_697102e1e36f43.06610568.jpeg', 1),
(199, 69, './uploads/img_697102e2675ff0.37282235.jpeg', 2),
(200, 70, './uploads/img_6971038fade158.81299625.jpeg', 0),
(201, 70, './uploads/img_697103923b7e70.17942807.jpeg', 1),
(204, 68, './uploads/img_6970fc59276cf2.92237958.jpeg', 0),
(205, 68, './uploads/img_6970fc5c0ab864.84979863.jpeg', 1),
(206, 71, './uploads/img_697106755a6d35.15579232.jpeg', 0),
(207, 71, './uploads/img_69710677928901.90947082.jpeg', 1),
(208, 72, './uploads/img_69710ddf57d8c7.12234699.jpeg', 0),
(209, 72, './uploads/img_69710df94d6489.86715028.jpeg', 1),
(210, 72, './uploads/img_69710df986d442.34185791.jpeg', 2),
(211, 73, './uploads/img_69710f5044c505.17351403.jpeg', 0),
(212, 73, './uploads/img_69710f509a1847.92993161.jpeg', 1),
(213, 73, './uploads/img_69710f51002765.10979098.jpeg', 2),
(214, 74, './uploads/img_697111b1cf6b40.47179068.webp', 0),
(215, 75, './uploads/img_69711255bf18e4.62720535.webp', 0),
(216, 76, './uploads/img_697114e11d3ce4.80763751.webp', 0),
(217, 77, './uploads/img_697115920ce441.59146710.webp', 0),
(218, 78, './uploads/img_697116c71b2ac0.79169231.webp', 0),
(219, 79, './uploads/img_697117ab7a5391.03215603.webp', 0),
(220, 80, './uploads/img_6971190e026d06.96481587.webp', 0),
(221, 81, './uploads/img_697119de521b89.70557390.webp', 0),
(222, 82, './uploads/img_69711ab3cc4896.15624388.webp', 0),
(223, 83, './uploads/img_69711b4d9f8515.64379877.webp', 0),
(231, 86, './uploads/img_69712ab7a17414.79044655.jpeg', 0),
(232, 86, './uploads/img_69712b2f66a9b9.59011227.jpg', 1),
(233, 85, './uploads/img_697129b6ac0df6.01158972.jpeg', 0),
(234, 85, './uploads/img_697129beabf7d4.38222943.webp', 1),
(235, 84, './uploads/img_697123bfe31715.34030310.webp', 0),
(236, 84, './uploads/img_69712a48122804.45512581.webp', 1),
(237, 87, './uploads/img_69712c0558b8f9.51737272.jpeg', 0),
(238, 87, './uploads/img_69712c203d8422.63074515.jpg', 1),
(243, 88, './uploads/img_697134d0653503.01695948.webp', 0),
(244, 88, './uploads/img_697134dcd4dd34.16145516.jpg', 1),
(245, 89, './uploads/img_697136979a7941.27022608.webp', 0),
(246, 89, './uploads/img_6971369e14a7f6.05090431.jpg', 1),
(247, 90, './uploads/img_6971376199b6d0.52769807.webp', 0),
(248, 90, './uploads/img_697137be622175.42556205.webp', 1),
(249, 91, './uploads/img_697138a0ccbad3.23544985.webp', 0),
(250, 91, './uploads/img_697138a4488103.57745198.jpg', 1),
(251, 92, './uploads/img_697139c329fb64.29379248.webp', 0),
(252, 92, './uploads/img_697139cb74dc00.02164442.jpg', 1),
(253, 93, './uploads/img_69713c117c2558.96607459.webp', 0),
(254, 93, './uploads/img_69713c16392e71.30563035.jpg', 1),
(263, 96, './uploads/img_69715b674a8e32.17659615.jpeg', 0),
(264, 97, './uploads/img_69715f21729eb0.30933683.webp', 0),
(265, 97, './uploads/img_69715f348962c1.99848184.webp', 1),
(268, 99, './uploads/img_697166a27bac28.56420486.webp', 0),
(269, 99, './uploads/img_697166a701b7b2.66152911.webp', 1),
(270, 99, './uploads/img_697166ab2058b8.10798600.webp', 2),
(271, 100, './uploads/img_69716b2ee9bbf5.74511330.webp', 0),
(272, 100, './uploads/img_69716b3174fa92.68363594.webp', 1),
(273, 101, './uploads/img_69716d971209f1.70101614.jpeg', 0),
(274, 102, './uploads/img_6971835c285cc0.41294536.webp', 0),
(275, 102, './uploads/img_6971837fc41a90.14253673.webp', 1),
(278, 104, './uploads/img_69718727857ae9.16843528.webp', 0),
(279, 104, './uploads/img_69718729e89dd0.92320391.webp', 1),
(280, 105, './uploads/img_69718cbcbef229.41902549.jpeg', 0),
(281, 105, './uploads/img_69718cbf1a4888.76135346.jpeg', 1),
(282, 106, './uploads/img_697191e1d1f2f5.24513789.jpg', 0),
(283, 107, './uploads/img_6972810bc04a76.55050555.jpg', 0),
(284, 108, './uploads/img_69728214c802e8.23622916.jpg', 0),
(285, 109, './uploads/img_697285baa41c26.09779718.jpg', 0),
(286, 110, './uploads/img_69728646c1afd5.96225868.jpg', 0),
(290, 114, './uploads/img_6977f6012dcd04.02896115.webp', 0),
(291, 115, './uploads/img_6977fbdd35cec4.30140715.webp', 0),
(292, 116, './uploads/img_6977fc812bbd16.08620915.webp', 0),
(293, 117, './uploads/img_6977fd4507b962.48291292.webp', 0),
(294, 118, './uploads/img_6977fdc8065263.23955702.webp', 0),
(295, 119, './uploads/img_6977fe6146f762.00670967.webp', 0),
(296, 103, './uploads/img_69780095078892.60671061.webp', 0),
(297, 103, './uploads/img_69780097245876.63448250.webp', 1),
(302, 121, './uploads/img_6978bf16b04f02.55247687.jpeg', 0),
(303, 121, './uploads/img_6978bf1eeca282.39992330.jpeg', 1),
(304, 121, './uploads/img_6978bf217d70c5.10348904.jpeg', 2),
(305, 122, './uploads/img_6978c0d06e5ee4.76436233.webp', 0),
(309, 124, './uploads/img_6978c81d6556b4.54487487.jpg', 0),
(310, 124, './uploads/img_6978c825516f90.80263926.jpg', 1),
(313, 123, './uploads/img_6978c730867955.55348719.jpg', 0),
(314, 123, './uploads/img_6978c73eede884.86995598.jpg', 1),
(315, 120, './uploads/img_6978c76bdc0916.11378949.jpg', 0),
(316, 125, './uploads/img_6978ca2b3a3403.36549851.jpg', 0),
(317, 126, './uploads/img_6978cb25a1a4e1.88064249.jpg', 0),
(318, 127, './uploads/img_6978cb8beee687.05711633.jpg', 0),
(319, 128, './uploads/img_6978cbff262806.10318010.jpg', 0),
(320, 98, './uploads/img_697164f35f5d23.26764639.jpeg', 0),
(321, 98, './uploads/img_697164f4dbe3c3.04767037.jpeg', 1),
(322, 94, './uploads/img_69714078aa89a8.28109084.webp', 0),
(323, 94, './uploads/img_69714083387048.66254023.webp', 1),
(324, 95, './uploads/img_697142768fe7b6.80776562.webp', 0),
(325, 95, './uploads/img_69714287a212b6.91277583.webp', 1),
(326, 18, './uploads/img_696e69ef57ca32.83163433.jpeg', 0),
(327, 18, './uploads/img_696e69ef72f893.97319408.jpeg', 1),
(328, 18, './uploads/img_696e69efb87009.73017695.jpeg', 2),
(337, 129, './uploads/img_6978d583df5246.90346806.jpeg', 0),
(338, 129, './uploads/img_6978d5950abfe3.75728576.jpg', 1),
(339, 129, './uploads/img_6978d5b145e0e1.18240043.jpeg', 2),
(340, 129, './uploads/img_6978d5ba6b9dc9.68535629.jpeg', 3),
(341, 130, './uploads/img_6978dae7d374d0.20238157.jpeg', 0),
(342, 130, './uploads/img_6978db051a62c5.33927529.jpeg', 1),
(343, 130, './uploads/img_6978db165301b1.67915223.jpeg', 2),
(344, 130, './uploads/img_6978db1d6e9d26.20490000.jpeg', 3),
(345, 36, './uploads/img_6978dc4713a755.83041368.jpeg', 0),
(346, 36, './uploads/img_6978dc666554c1.00184444.jpeg', 1),
(347, 131, './uploads/img_6978f1195d1849.86035168.jpeg', 0),
(348, 131, './uploads/img_6978f11d4f3143.65656013.jpeg', 1),
(349, 131, './uploads/img_6978f15b49ec24.02208435.jpeg', 2),
(350, 131, './uploads/img_6978f162a1d883.60579214.jpeg', 3),
(351, 132, './uploads/img_6978f3745e9328.97119049.jpeg', 0),
(352, 132, './uploads/img_6978f379680e63.31460103.jpeg', 1),
(353, 132, './uploads/img_6978f37fa99cb8.03921690.jpeg', 2),
(354, 133, './uploads/img_6978f4ee486ce7.86502935.jpeg', 0),
(355, 133, './uploads/img_6978f4f292dfe2.17567344.jpeg', 1),
(356, 134, './uploads/img_6978f6a26baf68.85683235.jpeg', 0),
(357, 134, './uploads/img_6978f6c38db5f6.10903277.jpeg', 1),
(358, 134, './uploads/img_6978f6d009f154.66356598.jpeg', 2),
(359, 135, './uploads/img_6978f8edc6d6f6.44629513.jpeg', 0),
(360, 135, './uploads/img_6978f8f91f7886.00496882.jpeg', 1),
(369, 137, './uploads/img_69790654d9c741.90081146.jpeg', 0),
(370, 137, './uploads/img_69790663416933.83135999.jpeg', 1),
(371, 138, './uploads/img_6979073e8c74c6.40199175.jpeg', 0),
(372, 138, './uploads/img_69790744612313.88941190.jpeg', 1),
(373, 138, './uploads/img_6979074c031838.68500338.jpeg', 2),
(374, 138, './uploads/img_69790755817da1.08719411.jpeg', 3),
(375, 139, './uploads/img_697909a5cf18c6.60462555.jpeg', 0),
(376, 139, './uploads/img_697909b923b9e0.79928731.jpeg', 1),
(377, 139, './uploads/img_697909bdc5ee49.65306319.jpeg', 2),
(378, 140, './uploads/img_69790d7a1524f7.16974203.jpeg', 0),
(379, 140, './uploads/img_69790d7c91edb5.62519766.jpeg', 1),
(380, 140, './uploads/img_69790d80b434e2.12194634.jpeg', 2),
(381, 141, './uploads/img_69790fa02788b7.01895453.jpeg', 0),
(382, 141, './uploads/img_69790fa4cce654.06783290.jpeg', 1),
(383, 142, './uploads/img_69791170caab28.45012410.jpeg', 0),
(384, 142, './uploads/img_69791171091314.60114037.jpeg', 1),
(385, 142, './uploads/img_697911768d84a1.07363935.jpeg', 2),
(386, 143, './uploads/img_6979131684b432.40711062.jpeg', 0),
(388, 143, './uploads/img_6979131943ce91.01999508.jpeg', 1),
(390, 143, './uploads/img_6979131c1d9489.44227047.jpeg', 2),
(392, 145, './uploads/img_69791bcc3775a4.45829428.jpeg', 0),
(393, 145, './uploads/img_69791bd5e52c35.44242387.jpeg', 1),
(395, 147, './uploads/img_697921cce9aea7.49881574.jpg', 0),
(396, 148, './uploads/img_6979224d3096f4.10566200.jpeg', 0),
(397, 149, './uploads/img_697922b741bbb3.83163536.jpg', 0),
(398, 150, './uploads/img_697923464cf964.82212537.jpg', 0),
(399, 146, './uploads/img_69791e076f1893.42056375.jpeg', 0),
(400, 151, './uploads/img_697928e67a96b8.09861606.jpeg', 0),
(401, 151, './uploads/img_697928e896df51.00026193.jpeg', 1),
(402, 152, './uploads/img_69792950e351b5.94824485.jpeg', 0),
(403, 152, './uploads/img_69792952d0c727.14942475.jpeg', 1),
(404, 153, './uploads/img_697929e1aabd42.54974785.jpeg', 0),
(405, 153, './uploads/img_697929e45bd569.58454197.jpeg', 1),
(406, 154, './uploads/img_69792a5452fbd8.54727139.jpeg', 0),
(407, 154, './uploads/img_69792a57eac9e4.39854572.jpeg', 1),
(408, 155, './uploads/img_69792af559aae7.08621178.jpeg', 0),
(409, 155, './uploads/img_69792afa64d246.12897291.jpeg', 1),
(410, 156, './uploads/img_69792cb55ea277.90081664.jpeg', 0),
(411, 156, './uploads/img_69792cbe2d50a0.08473765.webp', 1),
(412, 157, './uploads/img_69792f38379f70.33190906.jpeg', 0),
(413, 157, './uploads/img_69792f43b9bed6.01732516.webp', 1),
(414, 158, './uploads/img_697930e5405130.71021356.jpeg', 0),
(415, 158, './uploads/img_697930eccb1050.01528393.jpg', 1),
(416, 159, './uploads/img_69793cf693a7c4.10840782.jpeg', 0),
(417, 159, './uploads/img_69793cfcee9052.53873532.webp', 1),
(418, 160, './uploads/img_69793d6645b9a8.22179290.jpeg', 0),
(419, 160, './uploads/img_69793d696a6611.77797928.jpeg', 1),
(420, 161, './uploads/img_69793f374aa424.76600656.jpeg', 0),
(421, 161, './uploads/img_69793f3ce9cb52.21399131.jpeg', 1),
(422, 161, './uploads/img_69793f42390d61.85630360.jpeg', 2),
(423, 161, './uploads/img_69793f4645faf8.05088031.jpeg', 3),
(424, 162, './uploads/img_69793ff57995e2.56777088.jpeg', 0),
(425, 162, './uploads/img_69793ff83805e4.43264293.jpeg', 1),
(426, 162, './uploads/img_69793ffa3fc121.86112370.jpeg', 2),
(427, 162, './uploads/img_69793ffc8d0b03.53201831.jpeg', 3),
(428, 163, './uploads/img_69794e3a8fcb60.71083123.webp', 0),
(432, 136, './uploads/img_697904873e73e2.74447044.jpeg', 0),
(433, 136, './uploads/img_6979048f6d4022.25620585.jpeg', 1),
(434, 136, './uploads/img_69790496e4d979.74376349.jpeg', 2),
(435, 136, './uploads/img_697904a18d2284.29707534.jpeg', 3),
(446, 164, './uploads/img_6979519449d5e3.51706253.webp', 0),
(447, 164, './uploads/img_6979518abb3ba3.50789610.jpeg', 1),
(448, 164, './uploads/img_6979519f389258.37732206.jpeg', 2),
(449, 166, './uploads/prod_166_69a6a3af60ff9.png', 1),
(450, 166, './uploads/prod_166_69a6a3af6115e.png', 2),
(456, 3, '/./uploads/prod_3_69a741f9775d7.png', 1),
(457, 3, '/./uploads/prod_3_69a741f977723.png', 2),
(458, 3, '/./uploads/prod_3_69a741f9777be.png', 3),
(459, 3, '/./uploads/prod_3_69a741f97783a.png', 4),
(460, 3, '/./uploads/prod_3_69a741f9778a4.png', 5),
(465, 165, '/./uploads/prod_165_69a742baa5ab8.jpg', 1),
(466, 165, '/./uploads/prod_165_69a742baa5ba3.jpg', 2),
(467, 165, '/./uploads/prod_165_69a742baa5c00.jpg', 3),
(468, 165, '/./uploads/prod_165_69a742baa5c61.jpg', 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_marketplace_map`
--

CREATE TABLE `product_marketplace_map` (
  `id` bigint(20) NOT NULL,
  `store_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `external_product_id` varchar(120) DEFAULT NULL,
  `external_sku` varchar(120) DEFAULT NULL,
  `sync_status` varchar(40) DEFAULT 'pending',
  `last_sync_at` datetime DEFAULT NULL,
  `sync_message` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_variations`
--

CREATE TABLE `product_variations` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `barcode` varchar(60) DEFAULT NULL,
  `size_label` varchar(50) DEFAULT NULL,
  `color_label` varchar(50) DEFAULT NULL,
  `priceExtra` decimal(10,2) DEFAULT 0.00,
  `stock` int(11) DEFAULT 0,
  `min_stock_alert` int(11) DEFAULT 5,
  `active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `product_variations`
--

INSERT INTO `product_variations` (`id`, `product_id`, `name`, `sku`, `barcode`, `size_label`, `color_label`, `priceExtra`, `stock`, `min_stock_alert`, `active`, `sort_order`) VALUES
(3, 4, 'Seda Tatu do Bem King Size Brown', NULL, NULL, NULL, NULL, 0.00, 8, 5, 1, 0),
(4, 5, 'Seda King Paper Brown', NULL, NULL, NULL, NULL, 0.00, 12, 5, 1, 0),
(5, 6, 'Seda King Paper White ', NULL, NULL, NULL, NULL, 0.00, 28, 5, 1, 0),
(6, 7, 'Seda Guru Spirit Longa Slim ', NULL, NULL, NULL, NULL, 0.00, 17, 5, 1, 0),
(7, 8, ' Seda Zomo Slim King Size Alfafa', NULL, NULL, NULL, NULL, 0.00, 31, 5, 1, 0),
(8, 9, 'Seda Bem Bolado Marcelo D2 King Size', NULL, NULL, NULL, NULL, 0.00, 15, 5, 1, 0),
(9, 10, 'Seda Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 13, 5, 1, 0),
(10, 11, 'Seda Zomo Slim King Size', NULL, NULL, NULL, NULL, 0.00, 58, 5, 1, 0),
(11, 12, 'Seda Bem Bolado Pop King Size Slim 100 Folhas', NULL, NULL, NULL, NULL, 0.00, 18, 5, 1, 0),
(12, 13, 'Seda Papelito King Size Slim', NULL, NULL, NULL, NULL, 0.00, 47, 5, 1, 0),
(13, 14, ' Seda Zomo Brown Natural King Size ', NULL, NULL, NULL, NULL, 0.00, 8, 5, 1, 0),
(14, 15, 'Seda Bem Bolado MC Kevin Brown King Size Large', NULL, NULL, NULL, NULL, 0.00, 7, 5, 1, 0),
(15, 16, ' Seda Zomo Paper Perfect Pink King Size', NULL, NULL, NULL, NULL, 0.00, 13, 5, 1, 0),
(16, 17, 'Celulose Aleda Verde ', NULL, NULL, NULL, NULL, 0.00, 9, 5, 1, 0),
(18, 19, 'Piteira Papelito Longa Dupla 2x1', NULL, NULL, NULL, NULL, 0.00, 30, 5, 1, 0),
(20, 21, 'Piteira To Na Bê Mega Longa ', NULL, NULL, NULL, NULL, 0.00, 10, 5, 1, 0),
(22, 22, 'Piteira ToNaBê Extra Large Premium ', NULL, NULL, NULL, NULL, 0.00, 9, 5, 1, 0),
(24, 23, 'Piteira The Bulldog', NULL, NULL, NULL, NULL, 0.00, 15, 5, 1, 0),
(26, 24, 'Tabaco Acrema Blend 20g', NULL, NULL, NULL, NULL, 0.00, 6, 5, 1, 0),
(27, 20, 'Piteira Bem Bolado Girls In Green Hiper Large Vergê', NULL, NULL, NULL, NULL, 0.00, 11, 5, 1, 0),
(28, 25, 'Tabaco Véio Pimenta Rosin Premium 25g', NULL, NULL, NULL, NULL, 0.00, 10, 5, 1, 0),
(29, 26, 'Tabaquin 20g', NULL, NULL, NULL, NULL, 0.00, 5, 6, 1, 0),
(30, 27, 'Tabaco La Revolución Golden LRV 15g', NULL, NULL, NULL, NULL, 0.00, 10, 5, 1, 0),
(31, 28, 'Tabaco Amsterdam 25g', NULL, NULL, NULL, NULL, 0.00, 6, 5, 1, 0),
(35, 31, 'Slick De Silicone Sadhu 5 ml Black ', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(36, 32, 'Slick Silicone Sessãozada 5 ml Verde', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(37, 33, 'Slick de Silicone Sessãozada 11 ml Verde', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(38, 34, 'Slick de Slicone Cifrão 15ml Vermelha', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(39, 35, 'Slick de Slicone Cifrão 15ml Cinza', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(41, 37, 'Tesoura Dobrável Abduzido Rosa', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(42, 38, 'Tesoura Dobrável Sessãozada Preta', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(43, 39, 'Tesoura Dobrável Sadhu Preto', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(45, 40, 'Tesoura Dobrável Sadhu Laranja', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(46, 42, 'Tesoura de Metal Na Boa Ponta Arredondada', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(47, 43, 'Tesoura de Metal Na Boa Prata', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(48, 44, 'Tesoura de Metal Na Boa Ponta Arredondada', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(49, 45, 'Tesoura Dobrável Sadhu Azul', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(50, 46, 'Tesoura de Metal Na Boa Dourada', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(51, 47, 'Tesoura de Metal Na Boa Gold ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(53, 49, 'Slick Silicone SquadaFum Médio 10 ml Azul', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(54, 50, 'Slick Silicone SquadaFum Médio 10 ml Laranja', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(56, 52, 'Slick de Silicone Na Boa Brilha no Escuro 5 ml', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(57, 53, 'Slick de Silicone Oil Cultura Dab Rosa 2 ml ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(58, 54, 'Slick de Silicone Oil Cultura Dab Amarelo 2 ml ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(59, 55, 'Slick de Silicone Oil Cultura Dab Verde 2 ml ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(60, 56, 'Slick Silicone SquadaFum 3 ml Azul, Rosa e Amarelo', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(61, 57, 'Slick Silicone Ball To Na Bê 6 ml Model:Rosa e Preto', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(62, 58, 'Slick Silicone Sessãozada Lego C/ Divisórias 34 ml', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(63, 48, 'Tesoura Abduzido Pop Inox Model:Rainbow', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(64, 59, 'Slick Silicone Na Boa 5 ml Rosa Neon', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(65, 60, 'Slick De Silicone Sadhu 5 ml Colorido:Amarelo, Roxo e Branco', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(66, 61, 'Slick De Silicone Sadhu 5 ml Colorido:Amarelo e Azul Claro', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(67, 62, 'Slick de Silicone Oil Cultura Dab 5 ml Abelha', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(68, 63, 'Container Slick SquadaFum O.G Triangular Azul', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(69, 64, 'Slick De Silicone Sadhu 12 ml Com Divisórias Rosa,Laranja e Azul Claro', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(70, 65, 'Slick de Silicone Silly Dog 9ml', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(85, 69, 'Cuia De Silicone Sessãozada Vermelho', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(86, 70, 'Cuia De Silicone Sessãozada: Verde Neon', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(88, 68, 'Cuia De Silicone Sessãozada Roxo', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(89, 71, 'Cuia De Silicone Sessãozada: Vermelho, Azul e Roxo', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(90, 72, 'Cuia Silicone Bowl SquadaFum x Girls in Green: Rosa ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(91, 73, 'Cuia Silicone Bowl SquadaFum x Girls in Green: Amarelo', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(92, 74, 'Cuia Silicone Bowl SquadaFum: Preto, Branco e Cinza', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(93, 75, 'Cuia Silicone Bowl SquadaFum: Rosa e Verde Água', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(94, 76, 'Cuia Silicone Sadhu: Laranja', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(95, 77, 'Cuia Silicone Sadhu:Amarela', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(96, 78, 'Cuia Silicone Sadhu: Verde', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(97, 79, 'Cuia Silicone Sadhu: Preta', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(98, 80, 'Cuia Silicone Sadhu: Vermelha', NULL, NULL, NULL, NULL, 0.00, 3, 2, 1, 0),
(99, 81, 'Cuia Silicone Sadhu: Roxa', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(100, 82, 'Cuia Silicone Sadhu: Verde-Agua', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(101, 83, 'Cuia Silicone Sadhu: Azul-Claro', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(106, 86, 'ubelito Porta Cigarros Papelito: Verde-Neon', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(107, 85, 'Tubelito Porta Cigarros Papelito: Rosa', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(108, 84, 'Tubelito Porta Cigarros Papelito: Amarelo', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(109, 87, 'Tubelito Porta Cigarros Papelito: Laranja', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(112, 88, 'Mocó Big Smoke Tube Lion Rolling: Azul', NULL, NULL, NULL, NULL, 0.00, 7, 5, 1, 0),
(113, 89, 'Mocó Big Smoke Tube Lion Rolling: Rosa', NULL, NULL, NULL, NULL, 0.00, 7, 5, 1, 0),
(114, 90, 'Mocó Big Smoke Tube Lion Rolling: Laranja', NULL, NULL, NULL, NULL, 0.00, 8, 5, 1, 0),
(115, 91, 'Mocó Big Smoke Tube Lion Rolling: Amarelo', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(116, 93, 'Mocó Big Smoke Tube Lion Rolling: Verde', NULL, NULL, NULL, NULL, 0.00, 7, 5, 1, 0),
(121, 96, 'Seda De Vidro Sessãozada ', NULL, NULL, NULL, NULL, 0.00, 9, 5, 1, 0),
(122, 97, 'Piteira De Vidro Bear Glass 6 mm', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(124, 99, 'Piteiras de Vidro Raw 6 e 7 mm', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(125, 100, 'Piteira de Vidro LRV Curta', NULL, NULL, NULL, NULL, 0.00, 5, 5, 1, 0),
(126, 101, ' Piteira de Vidro Glass Crew C/ Escova de Limpeza', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(127, 102, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(129, 104, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(130, 105, 'Isqueiro Maçarico Zengaz ZL: Camuflagem', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(131, 106, 'Isqueiro Elétrico Firestar: (Chama Azul)', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(132, 107, 'Isqueiro Elétrico Firestar: (Chama Verde)', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(133, 108, 'Isqueiro Elétrico Firestar: (Chama Laranja)', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(134, 109, 'Isqueiro Elétrico Firestar: (Chama Amarelo)', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(135, 110, 'Isqueiro Elétrico Firestar: (Chama Vermelha)', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(137, 114, 'Isqueiro Clipper Sadhu: Verde', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(138, 115, 'Isqueiro Clipper Sadhu:Laranja', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(139, 116, 'Isqueiro Clipper Sadhu', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(140, 117, 'Isqueiro Clipper Sadhu: Preto', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(141, 118, 'Isqueiro Clipper Sadhu ', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(142, 119, 'Isqueiro Clipper Sadhu: Whiter', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(143, 103, 'Isqueiro Maçarico Sadhu Graffiti', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(145, 121, 'Seda Papelito King Size Brown Longa', NULL, NULL, NULL, NULL, 0.00, 22, 5, 1, 0),
(146, 122, 'Isqueiro Matue Bic Ez Reach: Azul', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(149, 124, 'Isqueiro Matue Bic Ez Reach: Roxo', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(151, 123, 'Isqueiro Matue Bic Ez Reach: Verde', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(152, 120, 'Isqueiro Maçarico Firestar: Verde', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(153, 125, 'Isqueiro Maçarico Firestar: Azul Marinho', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(154, 126, 'Isqueiro Maçarico Firestar: Azul ', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(155, 127, 'Isqueiro Maçarico Firestar: Preto', NULL, NULL, NULL, NULL, 0.00, 4, 5, 1, 0),
(156, 128, 'squeiro Maçarico Firestar: Rosa', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(157, 98, 'Piteira de Vidro Aleda C/ Escova de Limpeza', NULL, NULL, NULL, NULL, 0.00, 9, 5, 1, 0),
(158, 94, 'Mocó Tub Sadhu: Laranja', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(159, 95, 'Mocó Tub Sadhu:Preto', NULL, NULL, NULL, NULL, 0.00, 2, 5, 1, 0),
(160, 18, 'Piteira A Piteira Mega Longa ', NULL, NULL, NULL, NULL, 0.00, 20, 5, 1, 0),
(163, 129, 'Shoulder Bag Puff Life Mini: Preto', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(164, 130, 'Shoulder Bag Puff Life Mini: Rosa', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(165, 36, 'Case Medium Bola Ai', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(166, 131, 'Case Puff Life Mini:Preto', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(167, 132, 'Case Sessãozada Medium: Ice', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(168, 133, 'Bolador Lion Rolling Circus King Size 110 mm', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(169, 134, 'Gás Butano Bullfire XL Volcano Para Recarregar Isqueiro 600ml', NULL, NULL, NULL, NULL, 0.00, 3, 5, 1, 0),
(170, 135, 'Pedra Para Isqueiro Moon C/6 Cada', NULL, NULL, NULL, NULL, 0.00, 5, 5, 1, 0),
(173, 137, 'Model:Verde - Mago', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(174, 138, ' Bag Raw Brazil Preto', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(175, 139, ' Model:Ostentação', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(176, 140, '3 Partes Artistic Lips', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(177, 141, 'Medio 4 Partes: Alien ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(178, 142, 'Metal 4 Partes Grande: Full Folha ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(179, 143, 'Médio 4 Partes: Simpsons ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(181, 145, 'Grande 3 Partes: Na Boa Gold', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(183, 147, 'Cinzeiro de Vidro To Na Bê: Gangster', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(184, 148, 'Cinzeiro de Vidro To Na Bê Redondo', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(185, 149, 'inzeiro de Vidro To Na Bê Redondo: Snake', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(186, 150, 'Cinzeiro de Vidro To Na Bê Redondo: Hype', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(187, 146, 'Cinzeiro de Vidro To Na Bê: SharkCrazy', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(188, 151, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(189, 152, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(190, 153, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(191, 154, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(192, 155, 'Cinzeiro de Metal Lion Rolling Circus', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(193, 156, 'Dichavador de Acrílico Lion Rolling ', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(194, 157, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(195, 158, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, NULL, NULL, 0.00, 5, 5, 1, 0),
(196, 159, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(197, 160, 'Dichavador de Acrílico Lion Rolling', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(198, 161, 'Metal Box Sadhu Model:Alquimista', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(199, 162, ' Metal Box Sadhu Model:Shiva', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(200, 163, 'Bandeja De Metal Média: UTHC', NULL, NULL, NULL, NULL, 0.00, 1, 5, 1, 0),
(202, 136, ' Balança de Precisão 500 g x 0.1 g', NULL, NULL, NULL, NULL, 0.00, 6, 5, 1, 0),
(210, 164, 'Bandeja Metal Média com Divisória - Happy 420', NULL, NULL, NULL, NULL, 200.00, 20, 5, 1, 0),
(211, 166, '23 / 2323', NULL, NULL, NULL, NULL, 0.00, 0, 5, 1, 0),
(214, 3, 'Seda Tatu do Bem Small Size', NULL, NULL, NULL, NULL, 0.00, 8, 5, 1, 0),
(215, 3, 'Seda Tatu do Bem Small Size 2', NULL, NULL, NULL, NULL, 0.00, 8, 5, 1, 0),
(217, 165, 'preto', NULL, NULL, NULL, NULL, 0.00, 9, 5, 1, 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_views`
--

CREATE TABLE `product_views` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `product_id` int(11) NOT NULL,
  `views` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `product_views`
--

INSERT INTO `product_views` (`id`, `store_id`, `product_id`, `views`) VALUES
(1, 15, 164, 297),
(2, 15, 15, 2),
(3, 15, 10, 1),
(4, 15, 17, 1),
(5, 15, 11, 2),
(6, 15, 12, 1),
(7, 15, 23, 1),
(8, 15, 22, 4),
(9, 15, 25, 1),
(10, 15, 7, 2),
(11, 15, 13, 3),
(13, 15, 28, 1),
(14, 15, 31, 2),
(15, 15, 37, 1),
(16, 15, 40, 2),
(17, 15, 42, 1),
(18, 15, 43, 1),
(19, 15, 45, 1),
(20, 15, 50, 1),
(21, 15, 52, 1),
(22, 15, 53, 1),
(23, 1, 165, 0),
(24, 1, 166, 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives`
--

CREATE TABLE `representatives` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `representatives`
--

INSERT INTO `representatives` (`id`, `name`, `email`, `phone`, `slug`, `active`, `created_at`, `password`) VALUES
(1, 'João da Silva', 'joao@email.com', '11999999999', 'joao-silva', 1, '2026-01-28 23:13:12', '123'),
(2, 'wendisson santos', 'wswendisson4@gmail.com', '27997457019', 'wendissuu', 2, '2026-02-20 17:58:05', '$2y$10$VXDbhT7Li7LOvuzGi0HdUeWG5hlFbgff2usC1tW52ZsXc7foaB7Vq'),
(3, 'Juquinha', 'wswendisson@gmail.com', '27997457019', 'jujuca', 1, '2026-02-20 17:58:05', '$2y$10$VXDbhT7Li7LOvuzGi0HdUeWG5hlFbgff2usC1tW52ZsXc7foaB7Vq');

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_certificates`
--

CREATE TABLE `representatives_certificates` (
  `id` int(11) NOT NULL,
  `representative_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `issued_at` datetime DEFAULT current_timestamp(),
  `score` float DEFAULT NULL,
  `certificate_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_courses`
--

CREATE TABLE `representatives_courses` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `representatives_courses`
--

INSERT INTO `representatives_courses` (`id`, `title`, `description`, `created_at`, `updated_at`) VALUES
(1, 'edwfwedfwe', 'wefwerfwefwerf', '2026-02-20 18:48:48', '2026-02-20 18:48:48'),
(2, 'ewfergfergfrefer', 'rgergwervgfregr', '2026-02-20 18:49:05', '2026-02-20 18:49:05'),
(3, 'dewd', 'edewdwed', '2026-02-20 18:50:40', '2026-02-20 18:50:40');

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_lessons`
--

CREATE TABLE `representatives_lessons` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `position` int(11) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_lesson_questions`
--

CREATE TABLE `representatives_lesson_questions` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `option_a` varchar(255) DEFAULT NULL,
  `option_b` varchar(255) DEFAULT NULL,
  `option_c` varchar(255) DEFAULT NULL,
  `option_d` varchar(255) DEFAULT NULL,
  `correct_option` char(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_modules`
--

CREATE TABLE `representatives_modules` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `position` int(11) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `representatives_progress`
--

CREATE TABLE `representatives_progress` (
  `id` int(11) NOT NULL,
  `representative_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `score` float DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `settings`
--

INSERT INTO `settings` (`id`, `store_id`, `setting_key`, `setting_value`, `updated_at`) VALUES
(1, 15, 'ultramsg_token', 'n1x6t9kn5258xjzl', '2026-01-21 03:36:53'),
(2, 15, 'ultramsg_instance', 'instance158660', '2026-01-21 03:36:58');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_distance_logs`
--

CREATE TABLE `shipping_distance_logs` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `mode_used` enum('local_km','melhor_envio','fixed') NOT NULL DEFAULT 'local_km',
  `origin_zipcode` varchar(9) DEFAULT NULL,
  `destination_zipcode` varchar(9) NOT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `calculated_fee` decimal(10,2) DEFAULT NULL,
  `estimated_days` int(11) DEFAULT NULL,
  `status` enum('success','error') NOT NULL DEFAULT 'success',
  `error_message` varchar(255) DEFAULT NULL,
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_payload`)),
  `response_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_payload`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_fixed_config`
--

CREATE TABLE `shipping_fixed_config` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `fixed_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estimated_days` int(11) DEFAULT NULL,
  `enable_free_shipping_over` tinyint(1) NOT NULL DEFAULT 0,
  `free_shipping_min_amount` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_fixed_config`
--

INSERT INTO `shipping_fixed_config` (`id`, `store_id`, `fixed_price`, `estimated_days`, `enable_free_shipping_over`, `free_shipping_min_amount`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 15, 0.00, 5, 1, 0.00, 1, '2026-02-27 02:55:56', '2026-02-27 02:55:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_local_delivery_config`
--

CREATE TABLE `shipping_local_delivery_config` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `origin_zipcode` varchar(9) NOT NULL,
  `origin_address_label` varchar(120) DEFAULT NULL,
  `price_per_km` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_radius_km` decimal(10,2) DEFAULT NULL,
  `min_delivery_fee` decimal(10,2) DEFAULT NULL,
  `max_delivery_fee` decimal(10,2) DEFAULT NULL,
  `base_days` int(11) DEFAULT 1,
  `extra_days_per_10km` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_local_delivery_config`
--

INSERT INTO `shipping_local_delivery_config` (`id`, `store_id`, `origin_zipcode`, `origin_address_label`, `price_per_km`, `max_radius_km`, `min_delivery_fee`, `max_delivery_fee`, `base_days`, `extra_days_per_10km`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 15, '29010-004', NULL, 2.50, 50.00, NULL, NULL, NULL, NULL, 1, '2026-02-27 02:55:56', '2026-03-01 00:42:38');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_melhor_envio_config`
--

CREATE TABLE `shipping_melhor_envio_config` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `api_token` text DEFAULT NULL,
  `environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `set_as_default` tinyint(1) NOT NULL DEFAULT 0,
  `integration_status` enum('not_configured','configured','tested_ok','error') NOT NULL DEFAULT 'not_configured',
  `last_tested_at` datetime DEFAULT NULL,
  `last_error_message` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_melhor_envio_config`
--

INSERT INTO `shipping_melhor_envio_config` (`id`, `store_id`, `api_token`, `environment`, `set_as_default`, `integration_status`, `last_tested_at`, `last_error_message`, `created_at`, `updated_at`) VALUES
(1, 15, '3r3r3', 'production', 1, 'not_configured', NULL, NULL, '2026-02-27 02:55:56', '2026-02-28 00:16:56'),
(16, 56, 'V88pRFCOyQCw5OIOxfzIQDbBxwYDRyAfEPIsDZsj', 'production', 0, 'not_configured', NULL, NULL, '2026-03-04 00:00:34', '2026-03-04 00:01:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_melhor_envio_services`
--

CREATE TABLE `shipping_melhor_envio_services` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `service_code` varchar(60) NOT NULL,
  `service_label` varchar(100) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_melhor_envio_services`
--

INSERT INTO `shipping_melhor_envio_services` (`id`, `store_id`, `service_code`, `service_label`, `is_enabled`, `created_at`, `updated_at`) VALUES
(45, 15, '0', '0', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(46, 15, '1', '1', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(47, 15, '2', '2', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(48, 15, '3', '3', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(49, 15, '4', '4', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(50, 15, '5', '5', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(51, 15, '6', '6', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(52, 15, '7', '7', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(53, 15, '8', '8', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(54, 15, '9', '9', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(55, 15, '10', '10', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(56, 15, '11', '11', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(57, 15, '12', '12', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(58, 15, '13', '13', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(59, 15, '14', '14', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(60, 15, '15', '15', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(61, 15, '16', '16', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(62, 15, '17', '17', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(63, 15, '18', '18', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(64, 15, '19', '19', 1, '2026-02-28 00:16:56', '2026-02-28 00:16:56'),
(69, 56, '0', '0', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(70, 56, '1', '1', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(71, 56, '2', '2', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(72, 56, '3', '3', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(73, 56, '4', '4', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(74, 56, '5', '5', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(75, 56, '6', '6', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13'),
(76, 56, '7', '7', 1, '2026-03-04 00:01:13', '2026-03-04 00:01:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_rules`
--

CREATE TABLE `shipping_rules` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `target_type` enum('category','collection','all') NOT NULL DEFAULT 'all',
  `category_id` int(11) DEFAULT NULL,
  `collection_id` int(11) DEFAULT NULL,
  `shipping_mode` enum('all','melhor_envio','fixed','local_km') NOT NULL DEFAULT 'all',
  `action_type` enum('additional_fee','block','force_mode') NOT NULL,
  `additional_fee_amount` decimal(10,2) DEFAULT NULL,
  `force_mode` enum('melhor_envio','fixed','local_km') DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_rules`
--

INSERT INTO `shipping_rules` (`id`, `store_id`, `target_type`, `category_id`, `collection_id`, `shipping_mode`, `action_type`, `additional_fee_amount`, `force_mode`, `is_active`, `notes`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 15, 'category', NULL, NULL, 'all', 'additional_fee', 15.00, NULL, 1, 'Categoria: Eletrônicos (+R$15)', 1, '2026-02-27 02:55:56', '2026-02-27 02:55:56'),
(2, 15, 'collection', NULL, NULL, 'melhor_envio', 'block', NULL, NULL, 1, 'Coleção: Drop Inverno (bloquear frete)', 2, '2026-02-27 02:55:56', '2026-02-27 02:55:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_service_settings`
--

CREATE TABLE `shipping_service_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `store_id` int(10) UNSIGNED NOT NULL,
  `service_code` varchar(60) NOT NULL,
  `service_name` varchar(80) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `shipping_settings`
--

CREATE TABLE `shipping_settings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `active_mode` enum('melhor_envio','fixed','local_km') NOT NULL DEFAULT 'melhor_envio',
  `use_default_dimensions` tinyint(1) NOT NULL DEFAULT 0,
  `default_height_cm` decimal(10,2) DEFAULT NULL,
  `default_width_cm` decimal(10,2) DEFAULT NULL,
  `default_length_cm` decimal(10,2) DEFAULT NULL,
  `default_weight_kg` decimal(10,3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `shipping_settings`
--

INSERT INTO `shipping_settings` (`id`, `store_id`, `active_mode`, `use_default_dimensions`, `default_height_cm`, `default_width_cm`, `default_length_cm`, `default_weight_kg`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 15, 'melhor_envio', 0, 43.00, 32.00, 231.00, 21.000, 1, '2026-02-27 02:55:56', '2026-03-01 01:10:37'),
(15, 56, 'local_km', 0, 22.00, 25.00, 30.00, 20.000, 1, '2026-03-03 17:44:22', '2026-03-04 14:26:32'),
(16, 67, 'local_km', 0, NULL, NULL, NULL, NULL, 1, '2026-03-04 13:47:43', '2026-03-04 13:47:43');

-- --------------------------------------------------------

--
-- Estrutura para tabela `site_customization`
--

CREATE TABLE `site_customization` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 1,
  `top_bar_enabled` tinyint(1) DEFAULT 1,
  `top_bar_text` varchar(255) DEFAULT 'Entrega grátis acima de R$ 200',
  `top_bar_bg_type` varchar(20) DEFAULT 'color',
  `top_bar_bg_color` varchar(20) DEFAULT '#1D3A0E',
  `top_bar_gradient_start` varchar(20) DEFAULT '#1D3A0E',
  `top_bar_gradient_end` varchar(20) DEFAULT '#2D5016',
  `navbar_bg_color` varchar(20) DEFAULT '#FFFFFF',
  `navbar_text_color` varchar(20) DEFAULT '#2C2C2C',
  `navbar_button_color` varchar(20) DEFAULT '#2D5016',
  `navbar_cart_icon_color` varchar(20) DEFAULT NULL,
  `navbar_menu_icon_color` varchar(20) DEFAULT NULL,
  `navbar_display_type` varchar(20) DEFAULT 'icon',
  `navbar_name` varchar(100) DEFAULT '',
  `navbar_icon` varchar(50) DEFAULT NULL,
  `navbar_logo_path` text DEFAULT NULL,
  `navbar_logo_size` varchar(20) DEFAULT 'medium',
  `navbar_search_enabled` tinyint(1) DEFAULT 1,
  `header_title` varchar(255) DEFAULT '',
  `header_subtitle` text DEFAULT '',
  `header_bg_type` varchar(20) DEFAULT 'gradient',
  `header_bg_color` varchar(20) DEFAULT '#2D5016',
  `header_bg_gradient_start` varchar(20) DEFAULT '#1D3A0E',
  `header_bg_gradient_end` varchar(20) DEFAULT '#2D5016',
  `header_bg_image_path` text DEFAULT NULL,
  `header_image_size` varchar(20) DEFAULT 'medium',
  `header_border_radius` tinyint(1) DEFAULT 1,
  `header_button_enabled` tinyint(1) DEFAULT 1,
  `header_button_text` varchar(100) DEFAULT 'Ver Produtos',
  `header_button_bg_color` varchar(20) DEFAULT '#DAA520',
  `header_button_text_color` varchar(20) DEFAULT '#FFFFFF',
  `product_badge_bg_color` varchar(20) DEFAULT '#2D5016',
  `product_badge_text_color` varchar(20) DEFAULT '#FFFFFF',
  `product_button_bg_color` varchar(20) DEFAULT '#2D5016',
  `product_button_text_color` varchar(20) DEFAULT '#FFFFFF',
  `product_card_bg_color` varchar(20) DEFAULT '#FFFFFF',
  `product_card_border_color` varchar(20) DEFAULT '#E5E3DF',
  `category_type` varchar(20) DEFAULT 'icon',
  `category_image_size` varchar(20) DEFAULT 'medium',
  `category_border_radius` tinyint(1) DEFAULT 1,
  `category_display_shape` varchar(20) DEFAULT 'rounded',
  `category_icon_color` varchar(20) DEFAULT '#2D5016',
  `categories_show_names` tinyint(1) DEFAULT 1,
  `categories_title_visible` tinyint(1) DEFAULT 1,
  `products_title_visible` tinyint(1) DEFAULT 1,
  `featured_images_enabled` tinyint(1) DEFAULT 0,
  `featured_images_border_radius` tinyint(1) DEFAULT 1,
  `active_theme` varchar(50) DEFAULT 'default',
  `primary_color` varchar(20) DEFAULT '#2D5016',
  `accent_color` varchar(20) DEFAULT '#B8860B',
  `text_color` varchar(20) DEFAULT '#2C2C2C',
  `background_color` varchar(20) DEFAULT '#F8F7F5',
  `pix_key` varchar(255) DEFAULT NULL,
  `pix_name` varchar(255) DEFAULT NULL,
  `pix_city` varchar(100) DEFAULT NULL,
  `pix_display_type` enum('full','key_only') DEFAULT 'key_only',
  `pix_manual_confirmation_warning` tinyint(1) DEFAULT 1,
  `pix_warning_text` text DEFAULT 'A integração automática com PIX está em desenvolvimento. A confirmação do pagamento pode levar algum tempo e será feita manualmente pelo administrador.',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `site_customization`
--

INSERT INTO `site_customization` (`id`, `store_id`, `top_bar_enabled`, `top_bar_text`, `top_bar_bg_type`, `top_bar_bg_color`, `top_bar_gradient_start`, `top_bar_gradient_end`, `navbar_bg_color`, `navbar_text_color`, `navbar_button_color`, `navbar_cart_icon_color`, `navbar_menu_icon_color`, `navbar_display_type`, `navbar_name`, `navbar_icon`, `navbar_logo_path`, `navbar_logo_size`, `navbar_search_enabled`, `header_title`, `header_subtitle`, `header_bg_type`, `header_bg_color`, `header_bg_gradient_start`, `header_bg_gradient_end`, `header_bg_image_path`, `header_image_size`, `header_border_radius`, `header_button_enabled`, `header_button_text`, `header_button_bg_color`, `header_button_text_color`, `product_badge_bg_color`, `product_badge_text_color`, `product_button_bg_color`, `product_button_text_color`, `product_card_bg_color`, `product_card_border_color`, `category_type`, `category_image_size`, `category_border_radius`, `category_display_shape`, `category_icon_color`, `categories_show_names`, `categories_title_visible`, `products_title_visible`, `featured_images_enabled`, `featured_images_border_radius`, `active_theme`, `primary_color`, `accent_color`, `text_color`, `background_color`, `pix_key`, `pix_name`, `pix_city`, `pix_display_type`, `pix_manual_confirmation_warning`, `pix_warning_text`, `updated_at`) VALUES
(1, 15, 1, 'Entrega grátis acima de R$ 200', 'color', '#1d3a0e', '#1d3a0e', '#2d5016', '#ffffff', '#2c2c2c', '#2d5016', '#2c2c2c', '#2c2c2c', 'logo', 'Tabacaria Premium', 'cigarette', './uploads/custom_696e617a7a95a4.22387495.png', 'medium', 1, '', '', 'image', '#2d5016', '#1d3a0e', '#2d5016', './uploads/custom_696e617b14dd50.57818374.png', 'medium', 0, 0, 'Ver Produtos', '#daa520', '#ffffff', '#2d5016', '#ffffff', '#2d5016', '#ffffff', '#ffffff', '#e5e3df', 'icon', 'medium', 0, 'circular', '#2d5016', 0, 1, 0, 1, 1, 'custom', '#2d5016', '#b8860b', '#2c2c2c', '#f8f7f5', '14759371729', 'ihorhanes Pereira Carneiro', 'Espirito Santo', 'key_only', 1, 'A integração automática com PIX está em desenvolvimento. A confirmação do pagamento pode levar algum tempo e será feita manualmente pelo administrador.', '2026-01-28 00:15:58');

-- --------------------------------------------------------

--
-- Estrutura para tabela `stats`
--

CREATE TABLE `stats` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `page_views` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `stats`
--

INSERT INTO `stats` (`id`, `store_id`, `page_views`, `updated_at`) VALUES
(1, 1, 118, '2026-01-23 03:50:09'),
(2, 1, 118, '2026-01-23 03:50:09'),
(3, 1, 118, '2026-01-23 03:50:09'),
(4, 15, 175, '2026-02-06 18:57:05'),
(5, 17, 2, '2026-01-23 05:22:08'),
(6, 18, 41, '2026-02-01 02:17:38'),
(7, 19, 0, '2026-01-23 04:00:34'),
(8, 22, 0, '2026-01-23 04:00:34'),
(9, 23, 0, '2026-01-23 04:00:34'),
(10, 24, 3, '2026-01-23 04:26:51'),
(11, 25, 13, '2026-01-24 07:36:02'),
(12, 27, 2, '2026-01-23 05:37:26'),
(13, 28, 2, '2026-01-24 18:00:47'),
(14, 29, 2, '2026-01-27 18:40:03'),
(15, 55, 1, '2026-01-29 04:12:25');

-- --------------------------------------------------------

--
-- Estrutura para tabela `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subdomain` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `owner_email` varchar(255) DEFAULT NULL,
  `owner_phone` varchar(20) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `plan_id` int(11) DEFAULT 1,
  `segment` varchar(50) DEFAULT 'other',
  `perfil_objetivo` varchar(50) NOT NULL,
  `perfil_expansao` varchar(50) NOT NULL,
  `trial_days` int(11) DEFAULT 7,
  `trial_ends_at` datetime DEFAULT NULL,
  `suspended` tinyint(1) DEFAULT 0,
  `suspension_reason` text DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `days_remaining` int(11) DEFAULT 7,
  `default_template_code` varchar(100) NOT NULL DEFAULT 'orange_default',
  `personalization_initialized` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `stores`
--

INSERT INTO `stores` (`id`, `name`, `subdomain`, `description`, `owner_name`, `owner_email`, `owner_phone`, `active`, `created_at`, `updated_at`, `plan_id`, `segment`, `perfil_objetivo`, `perfil_expansao`, `trial_days`, `trial_ends_at`, `suspended`, `suspension_reason`, `internal_notes`, `days_remaining`, `default_template_code`, `personalization_initialized`) VALUES
(15, '027Ipanema', '027ipanem', 'Tabacaria da 027', 'Ihorhanes', '027ipanema@gmail.com', '27996713892', 1, '2026-01-21 01:54:39', '2026-02-27 19:25:43', 2, 'other', '', '', 7, '2026-02-12 16:29:08', 0, '', '', 7, 'orange_default', 0),
(56, 'Loja Teste', 'lojateste', NULL, 'Cliente Teste', 'cliente@teste.com', '11999999999', 1, '2026-02-22 16:06:06', '2026-03-03 20:03:45', 1, 'moda', 'local', 'no', 7, NULL, 0, NULL, NULL, 7, 'orange_default', 0),
(61, 'wendisson santos', 'wendisson-santos', NULL, 'wendisson santos santana', 'wswendisson4@gmail.com', '27997457019', 1, '2026-02-23 05:11:57', '2026-02-25 19:10:05', 1, 'moda', 'local', 'physical', 7, NULL, 0, NULL, NULL, 7, 'orange_default', 0),
(67, 'Imperial Store', 'imperial-store', NULL, 'Gabriel Watar Yaguinuma', 'gabrielwatar@gmail.com', '11958101324', 1, '2026-03-03 17:59:34', '2026-03-03 20:55:09', 2, 'moda', 'national', 'no', 7, NULL, 0, NULL, NULL, 7, 'orange_default', 0),
(68, 'Ipanema027', 'ipanema027', NULL, 'Ihorhanes Pereira Carneiro', 'ihorhanest2@hotmail.com', '27997088267', 0, '2026-03-04 01:56:16', '2026-03-04 01:56:16', 1, 'moda', 'local', 'no', 7, NULL, 0, NULL, NULL, 7, 'orange_default', 0),
(69, 'Minha Loja', 'minha-loja', NULL, 'teste', 'gabriel@gmail.com', '11958101324', 0, '2026-03-04 15:46:35', '2026-03-04 15:46:35', 1, 'eletronicos', 'national', 'yes', 7, NULL, 0, NULL, NULL, 7, 'orange_default', 0);

--
-- Acionadores `stores`
--
DELIMITER $$
CREATE TRIGGER `after_store_insert` AFTER INSERT ON `stores` FOR EACH ROW BEGIN
  INSERT INTO store_creation_context (store_id)
  VALUES (NEW.id);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `link_store_to_rep` AFTER INSERT ON `stores` FOR EACH ROW BEGIN
  IF @rep_id IS NOT NULL THEN
    INSERT INTO store_representatives
      (store_id, representative_id, source, created_at)
    VALUES
      (NEW.id, @rep_id, 'link', NOW());

    -- limpa o contexto
    SET @rep_id = NULL;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_activity_log`
--

CREATE TABLE `store_activity_log` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_creation_context`
--

CREATE TABLE `store_creation_context` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `store_creation_context`
--

INSERT INTO `store_creation_context` (`id`, `store_id`, `created_at`) VALUES
(1, 48, '2026-01-29 03:43:23'),
(2, 49, '2026-01-29 03:49:33'),
(3, 50, '2026-01-29 03:51:43'),
(4, 51, '2026-01-29 04:02:52'),
(5, 52, '2026-01-29 04:03:53'),
(6, 53, '2026-01-29 04:04:42'),
(7, 54, '2026-01-29 04:10:17'),
(8, 55, '2026-01-29 04:12:18'),
(9, 56, '2026-02-22 16:06:06'),
(11, 58, '2026-02-23 03:47:15'),
(12, 59, '2026-02-23 04:33:16'),
(13, 60, '2026-02-23 05:02:41'),
(14, 61, '2026-02-23 05:11:57'),
(16, 63, '2026-03-03 15:46:15'),
(17, 64, '2026-03-03 15:52:23'),
(18, 65, '2026-03-03 16:18:05'),
(19, 66, '2026-03-03 16:30:19'),
(20, 67, '2026-03-03 17:59:34'),
(21, 68, '2026-03-04 01:56:16'),
(22, 69, '2026-03-04 15:46:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_representatives`
--

CREATE TABLE `store_representatives` (
  `id` int(11) NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `representative_id` int(11) DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `store_representatives`
--

INSERT INTO `store_representatives` (`id`, `store_id`, `representative_id`, `source`, `created_at`) VALUES
(11, 50, 2, 'link', '2026-01-29 04:02:26'),
(12, 51, 2, 'link', '2026-01-29 04:02:52'),
(13, 52, 2, 'link', '2026-01-29 04:04:20'),
(14, 54, 2, 'link', '2026-01-29 04:10:17'),
(15, 55, 2, 'link', '2026-01-29 04:12:18');

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_segments`
--

CREATE TABLE `store_segments` (
  `id` int(11) NOT NULL,
  `segment_name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `suggested_categories` text DEFAULT NULL COMMENT 'JSON array of suggested category names/icons',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `store_segments`
--

INSERT INTO `store_segments` (`id`, `segment_name`, `display_name`, `icon`, `suggested_categories`, `created_at`) VALUES
(1, 'fashion', 'Moda & Vestuário', 'shirt', '[\"Camisetas\", \"Calças\", \"Vestidos\", \"Sapatos\", \"Acessórios\"]', '2026-01-22 16:16:24'),
(2, 'electronics', 'Eletrônicos', 'smartphone', '[\"Celulares\", \"Computadores\", \"TVs\", \"Áudio\", \"Câmeras\"]', '2026-01-22 16:16:24'),
(3, 'food', 'Alimentos & Bebidas', 'coffee', '[\"Bebidas\", \"Snacks\", \"Doces\", \"Salgados\", \"Congelados\"]', '2026-01-22 16:16:24'),
(4, 'beauty', 'Beleza & Cosméticos', 'sparkles', '[\"Maquiagem\", \"Skincare\", \"Cabelo\", \"Perfumes\", \"Unhas\"]', '2026-01-22 16:16:24'),
(5, 'home', 'Casa & Decoração', 'home', '[\"Móveis\", \"Decoração\", \"Iluminação\", \"Cozinha\", \"Jardim\"]', '2026-01-22 16:16:24'),
(6, 'sports', 'Esportes & Fitness', 'activity', '[\"Roupas\", \"Equipamentos\", \"Suplementos\", \"Acessórios\", \"Treino\"]', '2026-01-22 16:16:24'),
(7, 'books', 'Livros & Papelaria', 'book', '[\"Livros\", \"Cadernos\", \"Canetas\", \"Arte\", \"Organização\"]', '2026-01-22 16:16:24'),
(8, 'toys', 'Brinquedos & Jogos', 'gamepad-2', '[\"Brinquedos\", \"Jogos\", \"Pelúcias\", \"Puzzles\", \"Educativos\"]', '2026-01-22 16:16:24'),
(9, 'jewelry', 'Joias & Acessórios', 'gem', '[\"Colares\", \"Anéis\", \"Brincos\", \"Pulseiras\", \"Relógios\"]', '2026-01-22 16:16:24'),
(10, 'pet', 'Pet Shop', 'heart', '[\"Ração\", \"Brinquedos\", \"Camas\", \"Roupas\", \"Higiene\"]', '2026-01-22 16:16:24'),
(11, 'auto', 'Automotivo', 'car', '[\"Peças\", \"Acessórios\", \"Ferramentas\", \"Limpeza\", \"Som\"]', '2026-01-22 16:16:24'),
(12, 'other', 'Outros', 'package', '[\"Categoria 1\", \"Categoria 2\", \"Categoria 3\", \"Categoria 4\", \"Diversos\"]', '2026-01-22 16:16:24');

-- --------------------------------------------------------

--
-- Estrutura para tabela `store_subscriptions`
--

CREATE TABLE `store_subscriptions` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ends_at` datetime DEFAULT NULL,
  `status` enum('active','trial','expired','cancelled') DEFAULT 'trial',
  `payment_status` enum('paid','pending','failed') DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `billing_cycle` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `payment_external_id` varchar(255) DEFAULT NULL,
  `pix_qrcode` text DEFAULT NULL,
  `pix_copy_paste` text DEFAULT NULL,
  `payment_method` enum('pix','credit_card','boleto') DEFAULT 'pix',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `store_subscriptions`
--

INSERT INTO `store_subscriptions` (`id`, `store_id`, `plan_id`, `started_at`, `ends_at`, `status`, `payment_status`, `amount`, `created_at`, `billing_cycle`, `payment_external_id`, `pix_qrcode`, `pix_copy_paste`, `payment_method`, `updated_at`) VALUES
(5, 67, 2, '2026-02-03 18:00:08', '2026-04-05 18:00:08', 'active', 'paid', 139.90, '2026-03-03 17:59:36', 'monthly', 'pay_j8k1s64ko5imbyoe', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADB0lEQVR4Xu2VwY4bMQxD55b//6N+1tzS8InyzC6wcLGXagA6G1um+JiDhfZ4/3L9Ob4r/7pC7lbI3Qq5WyF3K+Ru/TfyPFgvytfJyfH5fnoquX+2yxlyLqkKXX9VO680zM5of8jBZKsC+doIS1e2rkM+g5RRnvayX6XiQj6IVNUencpZadpCPoR8t2rTV38TlzPkaFK+Qy+8/dgZ8sfPAHItPbwNKpwJg373hhxLui97w3VvxaWqigk5mSxJZ1Fc6uuQVsyGnE2KZRikqssELFNJPQ3+lZCzSUT1GAan3JmaBOiQo0m1MYDc0TLTdU9uzpBzSdwN4LxEAkFw8isqQ44l0TDoU21HUaqrjE4EDTmYxIFQLUjuptuvHwg5nFTPoJh1B3YpgtSODDmYLBzJHmVUjP6pLosvVYccSxbVkvwwTS2Gy+mYkGPJZQBSdUqQ51AeOZRFh5xNvjUJbGiqsJxgPSW3bsjRpBtVdesOL/VyhpxMyiKjpPbUIgO7EkoBDTmXRHeCGn56lMZIqC3kdFICbRrURrp9LMVqyMFk3fAffmpliNC9blYKDDmXbATohppqri10Q04mkc4ywiqL+QBCdp9LyPHkx6XThKKQvFZ25YWcTPZrA/rhteOppu3oVYUcSxr70vIXV4FXLmLI0WTDlMtUPKHf40KOJau3+hDcSKVwqM7KCzmY9P+zBzxTUDB2jkIEGww5lywdAJeXZwCsknHAhxxNqodjdU7nrLRbg3vIueSpl5ZB/mr227fke20hR5Nyqs9eTnnxlLnibkkhB5NvOgcPDFMlygWtUUALOZlcVjVt91gU0REVIybkWLJAuWwuP8uNaxkMOZfs5Yd20+OwxkQNlNskhJxI+qFf8vCtBH100eYEaZUZcjCpyvs6ZSbTs0ACMmfIyaR67DURXfnS02BBOSGfQX722yioqncvpajqh3wCWU9t/pSGTTjflRJyMklXCMCHRpS+aI71F3IyyQT0CCw3sg5daSvRwSHnkr9aIXcr5G6F3K2QuxVytx5G/gWUkdhUHUHmhwAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/d1a2639d-0b8d-40a5-9737-8d01ab083d855204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042289', 'pix', '2026-03-03 17:55:09'),
(6, 68, 1, '2026-03-03 22:56:18', NULL, 'trial', 'pending', 59.90, '2026-03-04 01:56:18', 'monthly', 'pay_z95jhscmmigzvadz', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADCElEQVR4Xu2UwW7kMAxDc8v//9F+Vm7d8FGyBwWKLHpZBaAnY0sUH3uIp8fXL9ef47vyryvk0wr5tEI+rZBPK+TT+m/kdbBOCdd5nffG8Lqle2bF23aGnEsu5lo2CL62r4z2hxxMtrrYxtBVytZ1yHeQMnpgL/supYd8EUkhVaOOYVfrQcg3kF9LVWNo+9dsOUOOJst5PX9WZsgfPgPItTTSww3Q+8YJo5lvRa2QY8maa/v0s6vrUpVjQs4mZTh1tF09mqhyX4sNOZs0pKE4t9Y5ARTpaKshx5K067RNPFGLUTTJ/I2Qc0nPrGmMA3SXjvv4MyHHkmqNYIDtr1I1W7buQo4lwbBWU3SXtyjBDHrI0WT9rncIJIai28/POuR00sYyqz5kpq/SycTaFXIu6bpge0hQdXFJHOnGdcixJJTAZYJpajE0OEMOJ2t8bmSdJVKaDjmbLBFvB3j5ty7URU1DziY1UkCdjFQ2s9SKUEDIyeTpd2/GnroLTvSnFNCQc8l79M1CgBTSyNLYW8jp5EIk216axtyLpZQaciyJ++RoXXFSDqVUt2+L5iHnkqB49tFKp9BaAQ05l6wrgJ1HYx2+Ijg9LyzkZNJGA0XolQu0izG5Ww45l3R7rXdub0lchZ3SVcixpLt7q19uG3cUH9+VFkOOJa1r5J/vNpnvxP6GnE16eo+bcAQTftne4WQIOZyUlUkNP8N8GLEFMORgEhSfKS83DtMUWCJoyLmk3i6vXHMmeqq9FOkcUoBDDiY3ptpDY7iRqvcWcjRpb90AO+XFY7PjPpJCTiaZtAXGAkBD6yqghZxMYipEj8eSi7C9Y8SEHEsaLCttESrwVtMpIUeTvbgA7dbTirzirRgNOZaUm3fcFwDstqJYdoI0YkNOJlWxe0onnkwzCrJShpCDSRMXJirfjWoQWrMv5BtIXnhdjH7nvH8v+2oecj6p81CAhyiuBCyIFXIwWb7C7gNR+qI51hNyMvn5P5hHCptvQIcqUe6Qo8lfrZBPK+TTCvm0Qj6tkE/rZeRfQhLIZGETOuwAAAAASUVORK5CYII=', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/45bb0a5a-d9d3-464e-aac6-0e03f51fb5e35204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***6304CEF8', 'pix', '2026-03-03 22:56:18'),
(7, 69, 1, '2026-03-04 12:46:37', NULL, 'trial', 'pending', 59.90, '2026-03-04 15:46:37', 'monthly', 'pay_o7xxt84tfso1l045', 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADBElEQVR4Xu2TQY4bMRADffP/f5Rn+eaYRba82CCYYC9pA5R3R63uKvow8u35w/Xr9r3zr6vm1ap5tWperZpXq+bV+m/m48a6Px936vtrf9X66MyWx5A1N5uq0lepKpwq8JMxfM3FZrrvP3hHeSps6pqfYYbIWWgugEtCa36O6SIjqlsaOgqv+RnmM12mf/BjvMmaq01x4q8/IWv+9bPAPEsvPoCKZOLQ/8rWXGtmPrggn9VRXEpVjqm52TyohoRYUN8Td45bc7XptrHZ4AIhKNLR7tZca+JpOLDHro5Dlu2aq01aoFKckzMwg8wcW3OzKVV45iJHF+czywinmmtNkPPUhD/KB69dzzie1txsvgnvgHAzG574mrtNla8Wy54AHAbISXZWzc3mQWmDsHIrJAHn4LrmXnNEofTJ8vVIjkoOwtSrudb0KIYYksLfcznS1qDmbjOS53oYEfXwZwp/Rc3dJl6ugEUyMHESJ+QE1Fxr6hBQzTBeZICH0VeIqrnW9Mwbg7x6dYgjS2M/au42bQD41aeyIJDTCam52zSbpwHi9PCPm1M6FmtuNodRXyj6WON58Q01N5tvxsbcBN0MJM1UHq3mdpN+UCB6oSbcoNs115rq2zHFlpugXbfgpExVc6054s3XADX/UBZNnWbNvaYqAxlMgn2uyPe4mmtNXQXdAn7DPpr2zC3PiKy53BxBtkLU0AUAZ7MiLmLNxSanA5+oUxF4R36QVnOz6XM4MiiNT9ooA9fca2omUFyG1qBp5exHzd3mtMyJFAuTQKAvSTUXm08mdO28YLsZITlcI7Cai82gatrGUzuG8YnRvOZa0yINZiIxJMHmMCk1V5uzlCBIYl79y3Qu/sTWXG2KRhjTOQogRV0nEElmzcUmKM9Q0tjIkfPuOLfmZlOzh94yKOcs2ljpwdb8DNO233Wq8+qHy7zmflOv+R7WRyXpkHZCay43mUI98nOm0HlstvNXc7MpGv5cgnF9AzTQLfHUW8215o9WzatV82rVvFo1r1bNq/Vh5m9W3aiETn7K9AAAAABJRU5ErkJggg==', '00020101021226800014br.gov.bcb.pix2558pix.asaas.com/qr/cobv/5fae386e-2dac-4511-8f80-09d3950413465204000053039865802BR5924Wendisson Santos Santana6007Vitoria61082909030062070503***63042056', 'pix', '2026-03-04 12:46:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `subscription_changes`
--

CREATE TABLE `subscription_changes` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `from_plan_id` int(11) NOT NULL,
  `to_plan_id` int(11) NOT NULL,
  `change_type` enum('upgrade','downgrade') NOT NULL,
  `effective_at` datetime NOT NULL,
  `status` enum('scheduled','applied','canceled') NOT NULL DEFAULT 'scheduled',
  `order_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `subscription_changes`
--

INSERT INTO `subscription_changes` (`id`, `store_id`, `from_plan_id`, `to_plan_id`, `change_type`, `effective_at`, `status`, `order_id`, `reason`, `created_at`, `updated_at`) VALUES
(1, 66, 1, 2, 'upgrade', '2026-03-03 14:33:19', 'applied', 29, 'Upgrade aguardando pagamento PIX', '2026-03-03 14:33:19', '2026-03-03 14:37:31'),
(2, 67, 1, 2, 'upgrade', '2026-03-03 15:51:38', 'applied', 36, 'Upgrade aguardando pagamento PIX', '2026-03-03 15:51:38', '2026-03-03 15:56:50');

-- --------------------------------------------------------

--
-- Estrutura para tabela `subscription_events`
--

CREATE TABLE `subscription_events` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `event_type` enum('invoice_created','invoice_paid','activated','renewed','expired','suspended','canceled','upgrade_scheduled','upgrade_applied','downgrade_scheduled','downgrade_applied') NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `subscription_events`
--

INSERT INTO `subscription_events` (`id`, `store_id`, `subscription_id`, `event_type`, `order_id`, `message`, `payload`, `created_at`) VALUES
(1, 63, 1, 'invoice_created', 24, 'Assinatura criada aguardando pagamento', '{\"plan_id\":2,\"plan_name\":\"Growth\",\"amount\":139.9,\"source\":\"register\"}', '2026-03-03 12:46:16'),
(2, 64, 2, 'invoice_created', 25, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":5,\"source\":\"register\"}', '2026-03-03 12:52:25'),
(3, 65, 3, 'invoice_created', 26, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":5,\"source\":\"register\"}', '2026-03-03 13:18:06'),
(4, 65, 3, 'invoice_paid', 26, 'Fatura de assinatura paga', '{\"asaas_event\":\"PAYMENT_RECEIVED\",\"asaas_payment_status\":\"RECEIVED\"}', '2026-03-03 13:23:47'),
(5, 65, 3, 'activated', 26, 'Loja ativa e assinatura regularizada', '{\"ends_at\":\"2026-04-03 16:23:47\"}', '2026-03-03 13:23:47'),
(6, 66, 4, 'invoice_created', 27, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":5,\"source\":\"register\"}', '2026-03-03 13:30:20'),
(7, 66, 4, 'invoice_paid', 27, 'Fatura de assinatura paga', '{\"asaas_event\":\"PAYMENT_RECEIVED\",\"asaas_payment_status\":\"RECEIVED\"}', '2026-03-03 13:30:58'),
(8, 66, 4, 'activated', 27, 'Loja ativa e assinatura regularizada', '{\"ends_at\":\"2026-04-03 16:30:58\"}', '2026-03-03 13:30:58'),
(9, 66, 4, 'invoice_created', 28, 'Fatura de renovação criada automaticamente', '{\"source\":\"maintenance\"}', '2026-03-03 13:37:23'),
(10, 66, 4, 'suspended', 28, 'Loja suspensa aguardando renovação', '{\"source\":\"maintenance\"}', '2026-03-03 13:37:23'),
(11, 66, 4, 'invoice_created', 29, 'Fatura de upgrade criada', '{\"from_plan_id\":1,\"to_plan_id\":2,\"amount\":139.9,\"asaas_payment_id\":\"pay_6tf9s2afwu2wh34d\"}', '2026-03-03 14:33:19'),
(12, 66, 4, 'upgrade_scheduled', 29, 'Upgrade agendado aguardando pagamento', '{\"to_plan_id\":2,\"order_id\":29}', '2026-03-03 14:33:19'),
(13, 66, 4, 'upgrade_applied', 29, 'Alteração de plano aplicada', '{\"change_id\":1}', '2026-03-03 14:37:31'),
(14, 67, 5, 'invoice_created', 30, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":5,\"source\":\"register\"}', '2026-03-03 14:59:36'),
(15, 67, 5, 'invoice_paid', 30, 'Fatura de assinatura paga', '{\"asaas_event\":\"PAYMENT_RECEIVED\",\"asaas_payment_status\":\"RECEIVED\"}', '2026-03-03 15:00:08'),
(16, 67, 5, 'activated', 30, 'Loja ativa e assinatura regularizada', '{\"ends_at\":\"2026-04-03 18:00:08\"}', '2026-03-03 15:00:08'),
(17, 67, 5, 'suspended', 35, 'Loja suspensa por assinatura vencida e fatura em aberto', '{\"subscription_ends_at\":\"2026-02-01 18:00:08\"}', '2026-03-03 15:30:36'),
(18, 67, 5, 'invoice_created', 36, 'Fatura de upgrade criada', '{\"from_plan_id\":1,\"to_plan_id\":2,\"amount\":139.9,\"asaas_payment_id\":\"pay_ryr1m1prnl7w44cu\"}', '2026-03-03 15:51:38'),
(19, 67, 5, 'upgrade_scheduled', 36, 'Upgrade agendado aguardando pagamento', '{\"to_plan_id\":2,\"order_id\":36}', '2026-03-03 15:51:38'),
(20, 67, 5, 'suspended', 40, 'Loja suspensa por assinatura vencida e fatura em aberto', '{\"subscription_ends_at\":\"2026-02-01 18:00:08\"}', '2026-03-03 15:56:50'),
(21, 67, 5, 'upgrade_applied', 36, 'Alteração de plano aplicada', '{\"change_id\":2}', '2026-03-03 15:56:50'),
(22, 68, 6, 'invoice_created', 41, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":59.9,\"source\":\"register\"}', '2026-03-03 22:56:18'),
(23, 69, 7, 'invoice_created', 42, 'Assinatura criada aguardando pagamento', '{\"plan_id\":1,\"plan_name\":\"Start\",\"amount\":59.9,\"source\":\"register\"}', '2026-03-04 12:46:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `subscription_invoices`
--

CREATE TABLE `subscription_invoices` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `order_id` int(11) NOT NULL,
  `invoice_type` enum('renewal','upgrade','downgrade') NOT NULL DEFAULT 'renewal',
  `cycle_start` datetime DEFAULT NULL,
  `cycle_end` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `status` enum('pending','paid','canceled','expired') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `supreme_admins`
--

CREATE TABLE `supreme_admins` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `supreme_admins`
--

INSERT INTO `supreme_admins` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(1, 'Super Admin', 'admin@minhabagg.com', '123456', '2026-01-18 03:58:02'),
(2, 'Super Admin', 'wswendisson4@gmail.com', '123456@', '2026-01-21 00:53:21');

-- --------------------------------------------------------

--
-- Estrutura para tabela `supreme_messages`
--

CREATE TABLE `supreme_messages` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied','archived') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_branding`
--

CREATE TABLE `template_branding` (
  `template_id` int(11) NOT NULL,
  `logo_mode` enum('icon_text','text_only','icon_only','image') DEFAULT 'icon_text',
  `logo_text` varchar(100) DEFAULT NULL,
  `logo_icon` varchar(50) DEFAULT NULL,
  `logo_image_path` varchar(255) DEFAULT NULL,
  `logo_image_url` varchar(255) DEFAULT NULL,
  `logo_alt_text` varchar(255) DEFAULT NULL,
  `logo_height_px` int(11) DEFAULT 40
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_branding`
--

INSERT INTO `template_branding` (`template_id`, `logo_mode`, `logo_text`, `logo_icon`, `logo_image_path`, `logo_image_url`, `logo_alt_text`, `logo_height_px`) VALUES
(1, 'icon_only', 'Lojinha teste', 'bag', './uploads/69a8f06ef34f7.png', 'https://minhabagg.com.br/uploads/69a8f06ef34f7.png', NULL, 50),
(2, 'icon_only', 'Lojinha teste', 'bag', './uploads/69a8f06ef34f7.png', 'https://minhabagg.com.br/uploads/69a8f06ef34f7.png', NULL, 50),
(3, 'image', '027Ipanema', 'bag', './uploads/69a9af70b2fcb.png', 'https://minhabagg.com.br/uploads/69a9af70b2fcb.png', NULL, 51);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_category_style`
--

CREATE TABLE `template_category_style` (
  `template_id` int(11) NOT NULL,
  `shape` enum('square','rounded','pill','circle') DEFAULT 'rounded',
  `show_border` tinyint(1) DEFAULT 0,
  `border_color` varchar(20) DEFAULT '#E5E7EB',
  `image_fit` enum('cover','contain') DEFAULT 'cover',
  `item_gap_px` int(11) DEFAULT 24,
  `item_size_px` int(11) DEFAULT 88,
  `title_font_size_px` int(11) DEFAULT 12,
  `title_font_weight` varchar(20) DEFAULT '700',
  `item_bg_color` varchar(20) DEFAULT '#FFFFFF',
  `item_radius_px` int(11) DEFAULT 20,
  `icon_size_px` int(11) DEFAULT 44,
  `section_padding_top_px` int(11) DEFAULT 16,
  `section_padding_bottom_px` int(11) DEFAULT 16,
  `justify_mode` enum('start','center','space-between') DEFAULT 'start',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_category_style`
--

INSERT INTO `template_category_style` (`template_id`, `shape`, `show_border`, `border_color`, `image_fit`, `item_gap_px`, `item_size_px`, `title_font_size_px`, `title_font_weight`, `item_bg_color`, `item_radius_px`, `icon_size_px`, `section_padding_top_px`, `section_padding_bottom_px`, `justify_mode`, `updated_at`) VALUES
(1, 'rounded', 0, '#00ff11', 'contain', 24, 70, 12, '700', '#FFFFFF', 20, 35, 16, 16, 'start', '2026-03-05 00:27:26'),
(2, 'rounded', 0, '#00ff11', 'contain', 24, 70, 12, '700', '#FFFFFF', 20, 35, 16, 16, 'start', '2026-03-05 00:27:26'),
(3, 'rounded', 0, '#1a0a52', 'cover', 20, 51, 11, '700', '#735454', 20, 43, 16, 16, 'center', '2026-03-05 00:27:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_feature_block`
--

CREATE TABLE `template_feature_block` (
  `template_id` int(11) NOT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `title_text` varchar(255) DEFAULT NULL,
  `description_text` text DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_route` varchar(255) DEFAULT '/',
  `feature_image_path` varchar(255) DEFAULT NULL,
  `feature_image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_feature_block`
--

INSERT INTO `template_feature_block` (`template_id`, `badge_text`, `title_text`, `description_text`, `button_text`, `button_route`, `feature_image_path`, `feature_image_url`) VALUES
(1, NULL, 'weddfrferf', 'wfrweferfqefrf', 'f4ffwer', '/effrffrfe', NULL, NULL),
(2, NULL, 'weddfrferf', 'wfrweferfqefrf', 'f4ffwer', '/effrffrfe', NULL, NULL),
(3, NULL, 'weddfrferf', 'wfrweferfqefrf', 'f4ffwer', 'https://minhabagg.com.br/', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_header_settings`
--

CREATE TABLE `template_header_settings` (
  `template_id` int(11) NOT NULL,
  `show_search` tinyint(1) DEFAULT 1,
  `show_cart` tinyint(1) DEFAULT 1,
  `show_customer` tinyint(1) DEFAULT 1,
  `cart_hover_bg` varchar(20) DEFAULT '#FF6321',
  `cart_hover_icon` varchar(20) DEFAULT '#FFFFFF',
  `customer_bg` varchar(20) DEFAULT '#F9F9F9',
  `customer_icon` varchar(20) DEFAULT '#141414',
  `header_variant` varchar(50) DEFAULT 'default',
  `sticky_enabled` tinyint(1) DEFAULT 1,
  `full_width_enabled` tinyint(1) DEFAULT 0,
  `flush_sides_enabled` tinyint(1) DEFAULT 0,
  `rounded_enabled` tinyint(1) DEFAULT 1,
  `border_enabled` tinyint(1) DEFAULT 0,
  `border_color` varchar(20) DEFAULT '#E5E7EB',
  `border_radius_px` int(11) DEFAULT 24,
  `container_max_width_px` int(11) DEFAULT 1400,
  `header_padding_y_px` int(11) DEFAULT 12,
  `header_padding_x_px` int(11) DEFAULT 16,
  `top_banner_enabled` tinyint(1) DEFAULT 0,
  `top_banner_text` varchar(255) DEFAULT NULL,
  `top_banner_subtext` varchar(255) DEFAULT NULL,
  `top_banner_button_text` varchar(100) DEFAULT NULL,
  `top_banner_button_route` varchar(255) DEFAULT NULL,
  `top_banner_bg` varchar(20) DEFAULT '#FF6321',
  `top_banner_text_color` varchar(20) DEFAULT '#FFFFFF',
  `top_banner_height_px` int(11) DEFAULT 44,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_header_settings`
--

INSERT INTO `template_header_settings` (`template_id`, `show_search`, `show_cart`, `show_customer`, `cart_hover_bg`, `cart_hover_icon`, `customer_bg`, `customer_icon`, `header_variant`, `sticky_enabled`, `full_width_enabled`, `flush_sides_enabled`, `rounded_enabled`, `border_enabled`, `border_color`, `border_radius_px`, `container_max_width_px`, `header_padding_y_px`, `header_padding_x_px`, `top_banner_enabled`, `top_banner_text`, `top_banner_subtext`, `top_banner_button_text`, `top_banner_button_route`, `top_banner_bg`, `top_banner_text_color`, `top_banner_height_px`, `updated_at`) VALUES
(1, 1, 1, 1, '#00ffe1', '#FFFFFF', '#F9F9F9', '#141414', 'centered', 1, 0, 0, 1, 0, 'transparent', 24, 1400, 12, 16, 0, 'xcsacxsdc', 'dewedede', NULL, NULL, '#FF6321', '#FFFFFF', 44, '2026-03-05 00:27:26'),
(2, 1, 1, 1, '#00ffe1', '#FFFFFF', '#F9F9F9', '#141414', 'centered', 1, 0, 0, 1, 0, 'transparent', 24, 1400, 12, 16, 0, 'xcsacxsdc', 'dewedede', NULL, NULL, '#FF6321', '#FFFFFF', 44, '2026-03-05 00:27:26'),
(3, 1, 1, 1, '#00ffe1', '#FFFFFF', '#F9F9F9', '#141414', 'centered', 1, 0, 0, 1, 0, '#F1F5F9', 0, 1240, 12, 16, 1, 'Frete grátis a partir de R$ 200,00', 'minhabagg.com.br', NULL, NULL, '#669d34', '#FFFFFF', 44, '2026-03-05 00:27:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_hero_slides`
--

CREATE TABLE `template_hero_slides` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `badge_bg` varchar(20) DEFAULT '#FF6321',
  `title_text` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_route` varchar(255) DEFAULT '/',
  `background_image_path` varchar(255) DEFAULT NULL,
  `background_image_url` varchar(255) DEFAULT NULL,
  `seconds_per_slide` int(11) DEFAULT 5,
  `is_enabled` tinyint(1) DEFAULT 1,
  `position` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_hero_slides`
--

INSERT INTO `template_hero_slides` (`id`, `template_id`, `badge_text`, `badge_bg`, `title_text`, `button_text`, `button_route`, `background_image_path`, `background_image_url`, `seconds_per_slide`, `is_enabled`, `position`) VALUES
(118, 1, NULL, '#FF6321', 'Novo Bannered', 'Comprar Agoraedw', '/de', './uploads/69a8f10a8b02b.png', 'https://minhabagg.com.br/uploads/69a8f10a8b02b.png', 5, 0, 343),
(148, 3, NULL, '#FF6321', 'Novo Banner', 'Comprar Agora', '/', './uploads/69a9afa9747b0.png', 'https://minhabagg.com.br/uploads/69a9afa9747b0.png', 5, 1, 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_highlights_carousel`
--

CREATE TABLE `template_highlights_carousel` (
  `template_id` int(11) NOT NULL,
  `background_enabled` tinyint(1) DEFAULT 0,
  `background_color` varchar(20) DEFAULT '#F9F9F9',
  `autoplay_enabled` tinyint(1) DEFAULT 1,
  `autoplay_interval_ms` int(11) DEFAULT 4000,
  `pause_on_interaction` tinyint(1) DEFAULT 1,
  `visible_desktop` int(11) DEFAULT 4,
  `visible_mobile` int(11) DEFAULT 2,
  `scroll_step_desktop` int(11) DEFAULT 1,
  `scroll_step_mobile` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_highlights_carousel`
--

INSERT INTO `template_highlights_carousel` (`template_id`, `background_enabled`, `background_color`, `autoplay_enabled`, `autoplay_interval_ms`, `pause_on_interaction`, `visible_desktop`, `visible_mobile`, `scroll_step_desktop`, `scroll_step_mobile`) VALUES
(1, 1, '#F0F4F8', 1, 5119, 1, 6, 3, 1, 1),
(2, 1, '#F0F4F8', 1, 5119, 1, 6, 3, 1, 1),
(3, 1, '#dfeed4', 1, 3061, 1, 4, 2, 1, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_nav_items`
--

CREATE TABLE `template_nav_items` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `route` varchar(255) NOT NULL,
  `position` int(11) DEFAULT 0,
  `is_enabled` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_nav_items`
--

INSERT INTO `template_nav_items` (`id`, `template_id`, `label`, `route`, `position`, `is_enabled`) VALUES
(381, 1, 'Produtos', '/produtos', 2, 1),
(382, 1, 'Categorias', '/categorias', 3, 1),
(383, 1, 'Promoções', '/promocoes', 4, 1),
(384, 2, 'Produtos', '/produtos', 2, 1),
(385, 2, 'Categorias', '/categorias', 3, 1),
(386, 2, 'Promoções', '/promocoes', 4, 1),
(633, 3, 'Produtos', '/produtos', 2, 1),
(634, 3, 'Categorias', '/categorias', 3, 1),
(635, 3, 'Promoções', '/promocoes', 4, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_product_card_style`
--

CREATE TABLE `template_product_card_style` (
  `template_id` int(11) NOT NULL,
  `show_product_name` tinyint(1) DEFAULT 1,
  `show_price` tinyint(1) DEFAULT 1,
  `show_installments` tinyint(1) DEFAULT 1,
  `show_buy_button` tinyint(1) DEFAULT 1,
  `show_old_price` tinyint(1) DEFAULT 0,
  `show_short_description` tinyint(1) DEFAULT 0,
  `text_alignment` enum('left','center','right') DEFAULT 'left',
  `shape` enum('square','rounded','pill','circle') DEFAULT 'rounded',
  `show_border` tinyint(1) DEFAULT 0,
  `border_color` varchar(20) DEFAULT '#E5E7EB',
  `image_fit` enum('cover','contain') DEFAULT 'cover',
  `card_padding_px` int(11) DEFAULT 16,
  `card_gap_px` int(11) DEFAULT 16,
  `image_ratio` enum('square','portrait','landscape') DEFAULT 'square',
  `button_text` varchar(100) DEFAULT 'Comprar',
  `button_full_width_mobile` tinyint(1) DEFAULT 1,
  `button_mobile_padding_px` int(11) DEFAULT 14,
  `button_mobile_margin_px` int(11) DEFAULT 16,
  `button_radius_px` int(11) DEFAULT 999,
  `mobile_button_font_size_px` int(11) DEFAULT 10,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_product_card_style`
--

INSERT INTO `template_product_card_style` (`template_id`, `show_product_name`, `show_price`, `show_installments`, `show_buy_button`, `show_old_price`, `show_short_description`, `text_alignment`, `shape`, `show_border`, `border_color`, `image_fit`, `card_padding_px`, `card_gap_px`, `image_ratio`, `button_text`, `button_full_width_mobile`, `button_mobile_padding_px`, `button_mobile_margin_px`, `button_radius_px`, `mobile_button_font_size_px`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 0, 1, 'left', 'rounded', 0, '#E5E7EB', 'contain', 12, 10, 'square', '', 0, 16, 17, 12, 10, '2026-03-05 00:27:26'),
(2, 1, 1, 1, 1, 0, 1, 'left', 'rounded', 0, '#E5E7EB', 'contain', 12, 10, 'square', '', 0, 16, 17, 12, 10, '2026-03-05 00:27:26'),
(3, 1, 1, 1, 1, 1, 0, 'left', 'rounded', 1, '#E5E7EB', 'cover', 7, 8, 'square', 'carrinho', 1, 11, 12, 19, 10, '2026-03-05 00:27:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_product_detail_style`
--

CREATE TABLE `template_product_detail_style` (
  `template_id` int(11) NOT NULL,
  `show_breadcrumb` tinyint(1) DEFAULT 1,
  `show_rating` tinyint(1) DEFAULT 1,
  `show_shipping_badge` tinyint(1) DEFAULT 1,
  `show_tabs` tinyint(1) DEFAULT 1,
  `sticky_buy_box_desktop` tinyint(1) DEFAULT 0,
  `gallery_layout` enum('vertical','horizontal','grid') DEFAULT 'horizontal',
  `image_fit` enum('cover','contain') DEFAULT 'cover',
  `button_style` enum('solid','outline','ghost') DEFAULT 'solid',
  `buy_now_button_text` varchar(100) DEFAULT 'Comprar Agora',
  `add_to_cart_button_text` varchar(100) DEFAULT 'Adicionar ao carrinho',
  `border_radius_px` int(11) DEFAULT 24,
  `info_gap_px` int(11) DEFAULT 16,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `installments_color` varchar(20) DEFAULT NULL,
  `benefits_icon_color` varchar(20) DEFAULT NULL,
  `benefits_text_color` varchar(20) DEFAULT NULL,
  `benefits_icon_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `template_product_detail_style`
--

INSERT INTO `template_product_detail_style` (`template_id`, `show_breadcrumb`, `show_rating`, `show_shipping_badge`, `show_tabs`, `sticky_buy_box_desktop`, `gallery_layout`, `image_fit`, `button_style`, `buy_now_button_text`, `add_to_cart_button_text`, `border_radius_px`, `info_gap_px`, `created_at`, `updated_at`, `installments_color`, `benefits_icon_color`, `benefits_text_color`, `benefits_icon_name`) VALUES
(1, 1, 1, 1, 1, 0, 'horizontal', 'cover', 'solid', 'Comprar Agora', 'Adicionar ao carrinho', 24, 16, '2026-03-04 04:48:22', '2026-03-04 05:41:42', NULL, NULL, NULL, NULL),
(2, 1, 1, 1, 1, 0, 'horizontal', 'cover', 'solid', 'Comprar Agora', 'Adicionar ao carrinho', 24, 16, '2026-03-04 04:48:22', '2026-03-04 05:41:42', NULL, NULL, NULL, NULL),
(3, 0, 1, 1, 1, 0, 'horizontal', 'cover', 'solid', 'Comprar Agora', 'Adicionar ao carrinho', 24, 27, '2026-03-04 04:48:22', '2026-03-04 05:41:42', '#00d64f', '#00e654', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_recommended_grid`
--

CREATE TABLE `template_recommended_grid` (
  `template_id` int(11) NOT NULL,
  `desktop_cols` int(11) DEFAULT 4,
  `mobile_cols` int(11) DEFAULT 2,
  `gap_desktop_px` int(11) DEFAULT 24,
  `gap_mobile_px` int(11) DEFAULT 12,
  `section_padding_top_px` int(11) DEFAULT 24,
  `section_padding_bottom_px` int(11) DEFAULT 24
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_recommended_grid`
--

INSERT INTO `template_recommended_grid` (`template_id`, `desktop_cols`, `mobile_cols`, `gap_desktop_px`, `gap_mobile_px`, `section_padding_top_px`, `section_padding_bottom_px`) VALUES
(1, 5, 2, 24, 12, 24, 24),
(2, 5, 2, 24, 12, 24, 24),
(3, 4, 2, 24, 12, 24, 24);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_sections`
--

CREATE TABLE `template_sections` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `section_key` varchar(50) NOT NULL,
  `title_text` varchar(255) DEFAULT NULL,
  `subtitle_text` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `position` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_sections`
--

INSERT INTO `template_sections` (`id`, `template_id`, `section_key`, `title_text`, `subtitle_text`, `is_enabled`, `position`) VALUES
(1, 1, 'categories', 'Departamentos', NULL, 0, 1),
(2, 1, 'highlights_carousel', 'Destaques da Semana', NULL, 1, 2),
(3, 1, 'recommended_grid', 'Sugestões Recomendadas', NULL, 1, 3),
(4, 1, 'feature_block', 'Engenharia em cada detalhe.', 'Nossas bags são projetadas para suportar o rigor do dia a dia moderno.', 1, 4),
(5, 1, 'video_section', 'Minha Bagg Lifestyle', NULL, 1, 5),
(6, 2, 'categories', 'Departamentos', NULL, 0, 1),
(7, 2, 'feature_block', 'Engenharia em cada detalhe.', 'Nossas bags são projetadas para suportar o rigor do dia a dia moderno.', 1, 4),
(8, 2, 'highlights_carousel', 'Destaques da Semana', NULL, 1, 2),
(9, 2, 'recommended_grid', 'Sugestões Recomendadas', NULL, 1, 3),
(10, 2, 'video_section', 'Minha Bagg Lifestyle', NULL, 1, 5),
(13, 3, 'categories', 'Departamentos', NULL, 1, 1),
(14, 3, 'feature_block', 'Engenharia em cada detalhe.', 'Nossas bags são projetadas para suportar o rigor do dia a dia moderno.', 1, 4),
(15, 3, 'highlights_carousel', 'Destaques da Semana', NULL, 1, 2),
(16, 3, 'recommended_grid', 'Sugestões Recomendadas', NULL, 1, 3),
(17, 3, 'video_section', 'Minha Bagg Lifestyle', NULL, 1, 5);

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_store_template`
--

CREATE TABLE `template_store_template` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_enabled` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_store_template`
--

INSERT INTO `template_store_template` (`id`, `store_id`, `template_id`, `is_active`, `is_enabled`, `created_at`, `updated_at`) VALUES
(1, 69, 2, 1, 1, '2026-03-05 04:00:49', '2026-03-05 04:00:49'),
(2, 15, 3, 1, 1, '2026-03-05 04:01:44', '2026-03-05 04:01:44');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_templates`
--

CREATE TABLE `template_templates` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_templates`
--

INSERT INTO `template_templates` (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'orange_default', 'Template Laranja', 'Template padrão da Minha Bagg', 1, '2026-02-27 21:31:42', '2026-02-27 21:31:42'),
(2, 'store_69_69a8fff1152d6', 'Template Personalizado Loja 69', 'Template exclusivo da loja 69', 1, '2026-03-05 04:00:49', '2026-03-05 04:00:49'),
(3, 'store_15_69a900280d024', 'Template Personalizado Loja 15', 'Template exclusivo da loja 15', 1, '2026-03-05 04:01:44', '2026-03-05 04:01:44');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_theme_settings`
--

CREATE TABLE `template_theme_settings` (
  `template_id` int(11) NOT NULL,
  `font_family` varchar(100) DEFAULT 'Inter',
  `heading_font_family` varchar(150) DEFAULT NULL,
  `body_font_family` varchar(150) DEFAULT NULL,
  `font_source` enum('system','google') DEFAULT 'google',
  `brand_color` varchar(20) DEFAULT '#FF6321',
  `brand_color_hover` varchar(20) DEFAULT '#E5591E',
  `text_color` varchar(20) DEFAULT '#141414',
  `muted_text_color` varchar(20) DEFAULT '#8E9299',
  `bg_color` varchar(20) DEFAULT '#FFFFFF',
  `surface_color` varchar(20) DEFAULT '#F9F9F9',
  `header_bg` varchar(20) DEFAULT '#FFFFFF',
  `header_text` varchar(20) DEFAULT '#141414',
  `border_radius_base` int(11) DEFAULT 12,
  `border_radius_button` int(11) DEFAULT 32,
  `border_radius_card` int(11) DEFAULT 32,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_theme_settings`
--

INSERT INTO `template_theme_settings` (`template_id`, `font_family`, `heading_font_family`, `body_font_family`, `font_source`, `brand_color`, `brand_color_hover`, `text_color`, `muted_text_color`, `bg_color`, `surface_color`, `header_bg`, `header_text`, `border_radius_base`, `border_radius_button`, `border_radius_card`, `updated_at`) VALUES
(1, 'Outfit', NULL, NULL, 'google', '#0066FF', '#0052CC', '#102A43', '#627D98', '#F0F4F8', '#FFFFFF', '#102A43', '#FFFFFF', 12, 12, 16, '2026-03-05 00:27:26'),
(2, 'Outfit', NULL, NULL, 'google', '#0066FF', '#0052CC', '#102A43', '#627D98', '#F0F4F8', '#FFFFFF', '#102A43', '#FFFFFF', 12, 12, 16, '2026-03-05 00:27:26'),
(3, 'Nunito', NULL, 'Nunito', 'google', '#669d34', '#76bb40', '#000000', '#8E8E8E', '#f9f9f9', '#FFFFFF', '#ffffff', '#141414', 9, 22, 24, '2026-03-05 00:27:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `template_video_settings`
--

CREATE TABLE `template_video_settings` (
  `template_id` int(11) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `source_type` enum('youtube','upload') DEFAULT 'youtube',
  `youtube_embed_url` varchar(255) DEFAULT NULL,
  `upload_video_path` varchar(255) DEFAULT NULL,
  `strip_color` varchar(20) DEFAULT '#FF6321',
  `button_color` varchar(20) DEFAULT '#FF6321',
  `button_icon_color` varchar(20) DEFAULT '#FFFFFF',
  `autoplay_on_click_only` tinyint(1) DEFAULT 1,
  `overlay_enabled` tinyint(1) DEFAULT 1,
  `overlay_opacity` decimal(4,2) DEFAULT 0.00,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `template_video_settings`
--

INSERT INTO `template_video_settings` (`template_id`, `is_enabled`, `source_type`, `youtube_embed_url`, `upload_video_path`, `strip_color`, `button_color`, `button_icon_color`, `autoplay_on_click_only`, `overlay_enabled`, `overlay_opacity`, `updated_at`) VALUES
(1, 1, 'youtube', 'https://www.youtube.com/embed/btPJPFnesV4?si=hLPmhipRjOA1tEDT', NULL, '#0066FF', '#0066FF', '#FFFFFF', 1, 1, 0.00, '2026-03-05 00:27:26'),
(2, 1, 'youtube', 'https://www.youtube.com/embed/btPJPFnesV4?si=hLPmhipRjOA1tEDT', NULL, '#0066FF', '#0066FF', '#FFFFFF', 1, 1, 0.00, '2026-03-05 00:27:26'),
(3, 1, 'youtube', 'https://www.youtube.com/embed/btPJPFnesV4?si=hLPmhipRjOA1tEDT', NULL, '#669d34', '#669d34', '#FFFFFF', 1, 1, 0.00, '2026-03-05 00:27:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `themes`
--

CREATE TABLE `themes` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `primary_color` varchar(20) NOT NULL,
  `accent_color` varchar(20) NOT NULL,
  `text_color` varchar(20) NOT NULL,
  `background_color` varchar(20) NOT NULL,
  `navbar_bg_color` varchar(20) NOT NULL,
  `navbar_text_color` varchar(20) NOT NULL,
  `navbar_button_color` varchar(20) NOT NULL,
  `header_bg_gradient_start` varchar(20) NOT NULL,
  `header_bg_gradient_end` varchar(20) NOT NULL,
  `header_button_bg_color` varchar(20) NOT NULL,
  `header_button_text_color` varchar(20) NOT NULL,
  `product_badge_bg_color` varchar(20) NOT NULL,
  `product_badge_text_color` varchar(20) NOT NULL,
  `product_button_bg_color` varchar(20) NOT NULL,
  `product_button_text_color` varchar(20) NOT NULL,
  `product_card_bg_color` varchar(20) NOT NULL,
  `top_bar_bg_color` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `themes`
--

INSERT INTO `themes` (`id`, `name`, `display_name`, `primary_color`, `accent_color`, `text_color`, `background_color`, `navbar_bg_color`, `navbar_text_color`, `navbar_button_color`, `header_bg_gradient_start`, `header_bg_gradient_end`, `header_button_bg_color`, `header_button_text_color`, `product_badge_bg_color`, `product_badge_text_color`, `product_button_bg_color`, `product_button_text_color`, `product_card_bg_color`, `top_bar_bg_color`, `created_at`) VALUES
(1, 'default', 'Padrão', '#2D5016', '#B8860B', '#2C2C2C', '#FFFFFF', '#FFFFFF', '#2C2C2C', '#2D5016', '#1D3A0E', '#2D5016', '#DAA520', '#FFFFFF', '#2D5016', '#FFFFFF', '#2D5016', '#FFFFFF', '#FFFFFF', '#1D3A0E', '2026-01-18 03:58:02'),
(2, 'amarelo', 'Amarelo Vibrante', '#F59E0B', '#FBBF24', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#F59E0B', '#D97706', '#F59E0B', '#FBBF24', '#FFFFFF', '#F59E0B', '#FFFFFF', '#F59E0B', '#FFFFFF', '#FFFFFF', '#D97706', '2026-01-20 02:39:34'),
(3, 'marrom', 'Marrom Elegante', '#78350F', '#92400E', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#78350F', '#78350F', '#92400E', '#A16207', '#FFFFFF', '#78350F', '#FFFFFF', '#78350F', '#FFFFFF', '#FFFFFF', '#78350F', '2026-01-20 02:39:34'),
(4, 'indigo', 'Índigo Profundo', '#4F46E5', '#6366F1', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#4F46E5', '#3730A3', '#4F46E5', '#6366F1', '#FFFFFF', '#4F46E5', '#FFFFFF', '#4F46E5', '#FFFFFF', '#FFFFFF', '#3730A3', '2026-01-20 02:39:34'),
(5, 'teal', 'Teal Moderno', '#0D9488', '#14B8A6', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#0D9488', '#0F766E', '#0D9488', '#14B8A6', '#FFFFFF', '#0D9488', '#FFFFFF', '#0D9488', '#FFFFFF', '#FFFFFF', '#0F766E', '2026-01-20 02:39:34'),
(6, 'pink', 'Pink Delicado', '#EC4899', '#F472B6', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#EC4899', '#DB2777', '#EC4899', '#F472B6', '#FFFFFF', '#EC4899', '#FFFFFF', '#EC4899', '#FFFFFF', '#FFFFFF', '#DB2777', '2026-01-20 02:39:34'),
(7, 'lime', 'Lima Fresco', '#65A30D', '#84CC16', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#65A30D', '#4D7C0F', '#65A30D', '#84CC16', '#FFFFFF', '#65A30D', '#FFFFFF', '#65A30D', '#FFFFFF', '#FFFFFF', '#4D7C0F', '2026-01-20 02:39:34'),
(8, 'amber', 'Âmbar Quente', '#D97706', '#F59E0B', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#D97706', '#B45309', '#D97706', '#F59E0B', '#FFFFFF', '#D97706', '#FFFFFF', '#D97706', '#FFFFFF', '#FFFFFF', '#B45309', '2026-01-20 02:39:34'),
(9, 'slate', 'Ardósia', '#475569', '#64748B', '#F3F4F6', '#0F172A', '#1E293B', '#F3F4F6', '#475569', '#1E293B', '#334155', '#64748B', '#FFFFFF', '#475569', '#FFFFFF', '#475569', '#FFFFFF', '#1E293B', '#0F172A', '2026-01-20 02:39:34'),
(10, 'emerald', 'Esmeralda', '#059669', '#10B981', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#059669', '#047857', '#059669', '#10B981', '#FFFFFF', '#059669', '#FFFFFF', '#059669', '#FFFFFF', '#FFFFFF', '#047857', '2026-01-20 02:39:34'),
(12, 'rosa', 'Rosa', '#D946A6', '#EC4899', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#D946A6', '#DB2777', '#D946A6', '#EC4899', '#FFFFFF', '#D946A6', '#FFFFFF', '#D946A6', '#FFFFFF', '#FFFFFF', '#BE185D', '2026-01-21 00:53:21'),
(13, 'preto', 'Preto', '#1F1F1F', '#404040', '#1F1F1F', '#FFFFFF', '#1F1F1F', '#FFFFFF', '#404040', '#1F1F1F', '#262626', '#404040', '#FFFFFF', '#1F1F1F', '#FFFFFF', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#000000', '2026-01-21 00:53:21'),
(14, 'azul', 'Azul', '#2563EB', '#3B82F6', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#2563EB', '#1E40AF', '#2563EB', '#3B82F6', '#FFFFFF', '#2563EB', '#FFFFFF', '#2563EB', '#FFFFFF', '#FFFFFF', '#1E3A8A', '2026-01-21 00:53:21'),
(15, 'verde', 'Verde', '#059669', '#10B981', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#059669', '#047857', '#059669', '#10B981', '#FFFFFF', '#059669', '#FFFFFF', '#059669', '#FFFFFF', '#FFFFFF', '#065F46', '2026-01-21 00:53:21'),
(16, 'dark', 'Dark', '#8B5CF6', '#A78BFA', '#F3F4F6', '#111827', '#1F2937', '#F3F4F6', '#8B5CF6', '#1F2937', '#374155', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF', '#8B5CF6', '#FFFFFF', '#1F2937', '#0F172A', '2026-01-21 00:53:21'),
(17, 'laranja', 'Laranja', '#EA580C', '#F97316', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#EA580C', '#C2410C', '#EA580C', '#F97316', '#FFFFFF', '#EA580C', '#FFFFFF', '#EA580C', '#FFFFFF', '#FFFFFF', '#9A3412', '2026-01-21 00:53:21'),
(18, 'vermelho', 'Vermelho', '#DC2626', '#EF4444', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#DC2626', '#B91C1C', '#DC2626', '#EF4444', '#FFFFFF', '#DC2626', '#FFFFFF', '#DC2626', '#FFFFFF', '#FFFFFF', '#991B1B', '2026-01-21 00:53:21'),
(19, 'roxo', 'Roxo', '#7C3AED', '#8B5CF6', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#7C3AED', '#6D28D9', '#7C3AED', '#8B5CF6', '#FFFFFF', '#7C3AED', '#FFFFFF', '#7C3AED', '#FFFFFF', '#FFFFFF', '#5B21B6', '2026-01-21 00:53:21'),
(20, 'ciano', 'Ciano', '#0891B2', '#06B6D4', '#1F1F1F', '#FFFFFF', '#FFFFFF', '#1F1F1F', '#0891B2', '#0E7490', '#0891B2', '#06B6D4', '#FFFFFF', '#0891B2', '#FFFFFF', '#0891B2', '#FFFFFF', '#FFFFFF', '#155E75', '2026-01-21 00:53:21');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_id` (`store_id`),
  ADD KEY `idx_store_admins` (`store_id`);

--
-- Índices de tabela `admin_panel_settings`
--
ALTER TABLE `admin_panel_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Índices de tabela `affiliate_clicks`
--
ALTER TABLE `affiliate_clicks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_clicks_store_affiliate` (`store_id`,`affiliate_profile_id`),
  ADD KEY `idx_affiliate_clicks_created_at` (`created_at`),
  ADD KEY `fk_affiliate_clicks_customer` (`customer_id`),
  ADD KEY `idx_affiliate_clicks_store` (`store_id`),
  ADD KEY `idx_affiliate_clicks_profile` (`affiliate_profile_id`),
  ADD KEY `idx_affiliate_clicks_created` (`created_at`);

--
-- Índices de tabela `affiliate_conversions`
--
ALTER TABLE `affiliate_conversions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_affiliate_conversions_order` (`order_id`),
  ADD UNIQUE KEY `ux_affiliate_conversions_order_profile` (`order_id`,`affiliate_profile_id`),
  ADD KEY `idx_affiliate_conversions_store_affiliate` (`store_id`,`affiliate_profile_id`),
  ADD KEY `idx_affiliate_conversions_status` (`conversion_status`),
  ADD KEY `fk_affiliate_conversions_click` (`click_id`),
  ADD KEY `fk_affiliate_conversions_customer` (`customer_id`),
  ADD KEY `idx_affiliate_conversions_store` (`store_id`),
  ADD KEY `idx_affiliate_conversions_profile` (`affiliate_profile_id`),
  ADD KEY `idx_affiliate_conversions_order` (`order_id`);

--
-- Índices de tabela `affiliate_payouts`
--
ALTER TABLE `affiliate_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_affiliate_payouts_store` (`store_id`),
  ADD KEY `idx_affiliate_payouts_affiliate` (`affiliate_profile_id`);

--
-- Índices de tabela `affiliate_profiles`
--
ALTER TABLE `affiliate_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_affiliate_profiles_store_slug` (`store_id`,`slug`),
  ADD UNIQUE KEY `uk_affiliate_profiles_store_customer` (`store_id`,`customer_id`),
  ADD UNIQUE KEY `ux_affiliate_profiles_store_slug` (`store_id`,`slug`),
  ADD KEY `idx_affiliate_profiles_status` (`status`),
  ADD KEY `idx_affiliate_profiles_store` (`store_id`),
  ADD KEY `idx_affiliate_profiles_customer` (`customer_id`);

--
-- Índices de tabela `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_id` (`store_id`),
  ADD KEY `idx_store_name` (`store_id`,`name`),
  ADD KEY `idx_categories_store` (`store_id`),
  ADD KEY `idx_categories_parent` (`parent_id`),
  ADD KEY `idx_categories_sort` (`store_id`,`sort_order`),
  ADD KEY `idx_categories_active` (`is_active`),
  ADD KEY `idx_categories_store_parent_sort` (`store_id`,`parent_id`,`sort_order`);

--
-- Índices de tabela `checkout_recommendations`
--
ALTER TABLE `checkout_recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_checkout_recommendations_store` (`store_id`),
  ADD KEY `idx_checkout_recommendations_product` (`product_id`);

--
-- Índices de tabela `collections`
--
ALTER TABLE `collections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_collections_store` (`store_id`),
  ADD KEY `idx_collections_status` (`status`),
  ADD KEY `idx_collections_sort` (`store_id`,`sort_order`),
  ADD KEY `idx_collections_store_status_sort` (`store_id`,`status`,`sort_order`);

--
-- Índices de tabela `collection_items`
--
ALTER TABLE `collection_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_collection_product` (`collection_id`,`product_id`),
  ADD KEY `idx_collection` (`collection_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Índices de tabela `collection_products`
--
ALTER TABLE `collection_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_collection_product` (`collection_id`,`product_id`),
  ADD KEY `idx_collection_products_collection` (`collection_id`),
  ADD KEY `idx_collection_products_product` (`product_id`),
  ADD KEY `idx_collection_products_sort` (`collection_id`,`sort_order`);

--
-- Índices de tabela `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_unique` (`email`,`store_id`),
  ADD UNIQUE KEY `cpf_unique` (`cpf`,`store_id`),
  ADD KEY `store_idx` (`store_id`);

--
-- Índices de tabela `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_idx` (`customer_id`);

--
-- Índices de tabela `featured_images`
--
ALTER TABLE `featured_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_id` (`store_id`);

--
-- Índices de tabela `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `subscription_id` (`subscription_id`);

--
-- Índices de tabela `marketplace_catalog`
--
ALTER TABLE `marketplace_catalog`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_marketplace_catalog_code` (`code`);

--
-- Índices de tabela `marketplace_integrations`
--
ALTER TABLE `marketplace_integrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_store_marketplace_unique` (`store_id`,`marketplace_catalog_id`),
  ADD KEY `idx_marketplace_integrations_store` (`store_id`),
  ADD KEY `idx_marketplace_integrations_status` (`connection_status`),
  ADD KEY `fk_marketplace_integrations_catalog` (`marketplace_catalog_id`);

--
-- Índices de tabela `marketplace_sync_logs`
--
ALTER TABLE `marketplace_sync_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_marketplace_sync_logs_store_created` (`store_id`,`created_at`),
  ADD KEY `idx_marketplace_sync_logs_integration` (`marketplace_integration_id`);

--
-- Índices de tabela `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_unread` (`store_id`,`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Índices de tabela `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Índices de tabela `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_idx` (`customer_id`),
  ADD KEY `idx_orders_affiliate_profile_id` (`affiliate_profile_id`),
  ADD KEY `idx_orders_store_status_created` (`store_id`,`status`,`created_at`),
  ADD KEY `idx_orders_store_tipo_status` (`store_id`,`tipo`,`status`),
  ADD KEY `idx_orders_asaas_payment_id` (`asaas_payment_id`),
  ADD KEY `idx_orders_payment_external_id` (`payment_external_id`);

--
-- Índices de tabela `order_addresses`
--
ALTER TABLE `order_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Índices de tabela `order_gateway_logs`
--
ALTER TABLE `order_gateway_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_gateway_logs_store` (`store_id`),
  ADD KEY `idx_order_gateway_logs_order` (`order_id`);

--
-- Índices de tabela `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_idx` (`order_id`);

--
-- Índices de tabela `order_logistics_history`
--
ALTER TABLE `order_logistics_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_olh_order` (`order_id`),
  ADD KEY `idx_olh_store` (`store_id`),
  ADD KEY `idx_olh_created` (`created_at`);

--
-- Índices de tabela `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_changed_at` (`changed_at`);

--
-- Índices de tabela `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `plan_billing`
--
ALTER TABLE `plan_billing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_plan_billing` (`plan_id`,`billing_cycle`),
  ADD KEY `idx_plan_billing_plan` (`plan_id`);

--
-- Índices de tabela `plan_features`
--
ALTER TABLE `plan_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_plan_features_plan` (`plan_id`),
  ADD KEY `idx_plan_features_sort` (`plan_id`,`sort_order`);

--
-- Índices de tabela `plan_limits`
--
ALTER TABLE `plan_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_plan_limits` (`plan_id`,`limit_key`),
  ADD KEY `idx_plan_limits_plan` (`plan_id`);

--
-- Índices de tabela `platform_config`
--
ALTER TABLE `platform_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Índices de tabela `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_id` (`store_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_active` (`active`),
  ADD KEY `idx_products_store_active_created` (`store_id`,`active`,`created_at`);

--
-- Índices de tabela `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Índices de tabela `product_marketplace_map`
--
ALTER TABLE `product_marketplace_map`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_prod_provider` (`product_id`,`provider`),
  ADD KEY `idx_pmm_store` (`store_id`);

--
-- Índices de tabela `product_variations`
--
ALTER TABLE `product_variations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_variations_product_active` (`product_id`,`active`);

--
-- Índices de tabela `product_views`
--
ALTER TABLE `product_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_product_views_store` (`store_id`,`product_id`),
  ADD KEY `idx_store_product_views` (`store_id`,`product_id`);

--
-- Índices de tabela `representatives`
--
ALTER TABLE `representatives`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `representatives_certificates`
--
ALTER TABLE `representatives_certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `representative_id` (`representative_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Índices de tabela `representatives_courses`
--
ALTER TABLE `representatives_courses`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `representatives_lessons`
--
ALTER TABLE `representatives_lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`);

--
-- Índices de tabela `representatives_lesson_questions`
--
ALTER TABLE `representatives_lesson_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- Índices de tabela `representatives_modules`
--
ALTER TABLE `representatives_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Índices de tabela `representatives_progress`
--
ALTER TABLE `representatives_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `representative_id` (`representative_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- Índices de tabela `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_id` (`store_id`),
  ADD KEY `idx_key_store` (`setting_key`,`store_id`),
  ADD KEY `idx_store_setting` (`store_id`,`setting_key`);

--
-- Índices de tabela `shipping_distance_logs`
--
ALTER TABLE `shipping_distance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_distance_logs_store` (`store_id`),
  ADD KEY `idx_distance_logs_created` (`created_at`);

--
-- Índices de tabela `shipping_fixed_config`
--
ALTER TABLE `shipping_fixed_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_fixed_config_store` (`store_id`);

--
-- Índices de tabela `shipping_local_delivery_config`
--
ALTER TABLE `shipping_local_delivery_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_local_delivery_store` (`store_id`);

--
-- Índices de tabela `shipping_melhor_envio_config`
--
ALTER TABLE `shipping_melhor_envio_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_me_config_store` (`store_id`);

--
-- Índices de tabela `shipping_melhor_envio_services`
--
ALTER TABLE `shipping_melhor_envio_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_me_service_store_code` (`store_id`,`service_code`),
  ADD KEY `idx_me_service_store` (`store_id`);

--
-- Índices de tabela `shipping_rules`
--
ALTER TABLE `shipping_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shipping_rules_store` (`store_id`),
  ADD KEY `idx_shipping_rules_target` (`target_type`,`category_id`,`collection_id`),
  ADD KEY `idx_shipping_rules_mode` (`shipping_mode`),
  ADD KEY `idx_shipping_rules_active` (`is_active`);

--
-- Índices de tabela `shipping_service_settings`
--
ALTER TABLE `shipping_service_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ship_service` (`store_id`,`service_code`);

--
-- Índices de tabela `shipping_settings`
--
ALTER TABLE `shipping_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_shipping_settings_store` (`store_id`),
  ADD KEY `idx_shipping_settings_mode` (`active_mode`);

--
-- Índices de tabela `site_customization`
--
ALTER TABLE `site_customization`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_store_customization` (`store_id`),
  ADD KEY `idx_store_id` (`store_id`);

--
-- Índices de tabela `stats`
--
ALTER TABLE `stats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_store_stats` (`store_id`);

--
-- Índices de tabela `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subdomain` (`subdomain`),
  ADD KEY `idx_subdomain` (`subdomain`),
  ADD KEY `idx_active` (`active`),
  ADD KEY `fk_stores_plan` (`plan_id`);

--
-- Índices de tabela `store_activity_log`
--
ALTER TABLE `store_activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Índices de tabela `store_creation_context`
--
ALTER TABLE `store_creation_context`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `store_representatives`
--
ALTER TABLE `store_representatives`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `store_segments`
--
ALTER TABLE `store_segments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `segment_name` (`segment_name`),
  ADD KEY `idx_segment_name` (`segment_name`);

--
-- Índices de tabela `store_subscriptions`
--
ALTER TABLE `store_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_store_subscriptions_store_status` (`store_id`,`status`),
  ADD KEY `idx_store_subscriptions_ends_at` (`ends_at`);

--
-- Índices de tabela `subscription_changes`
--
ALTER TABLE `subscription_changes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sub_changes_store` (`store_id`),
  ADD KEY `idx_sub_changes_status` (`status`),
  ADD KEY `idx_sub_changes_effective` (`effective_at`),
  ADD KEY `idx_sub_changes_order` (`order_id`),
  ADD KEY `idx_subscription_changes_store_status_effective` (`store_id`,`status`,`effective_at`),
  ADD KEY `idx_subscription_changes_order_id` (`order_id`);

--
-- Índices de tabela `subscription_events`
--
ALTER TABLE `subscription_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sub_events_store` (`store_id`),
  ADD KEY `idx_sub_events_created` (`created_at`),
  ADD KEY `idx_sub_events_type` (`event_type`);

--
-- Índices de tabela `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subscription_invoices_order` (`order_id`),
  ADD KEY `idx_subscription_invoices_store_status` (`store_id`,`status`),
  ADD KEY `idx_subscription_invoices_sub_status` (`subscription_id`,`status`);

--
-- Índices de tabela `supreme_admins`
--
ALTER TABLE `supreme_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- Índices de tabela `supreme_messages`
--
ALTER TABLE `supreme_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Índices de tabela `template_branding`
--
ALTER TABLE `template_branding`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_category_style`
--
ALTER TABLE `template_category_style`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_feature_block`
--
ALTER TABLE `template_feature_block`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_header_settings`
--
ALTER TABLE `template_header_settings`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_hero_slides`
--
ALTER TABLE `template_hero_slides`
  ADD PRIMARY KEY (`id`),
  ADD KEY `template_idx` (`template_id`);

--
-- Índices de tabela `template_highlights_carousel`
--
ALTER TABLE `template_highlights_carousel`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_nav_items`
--
ALTER TABLE `template_nav_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `template_idx` (`template_id`);

--
-- Índices de tabela `template_product_card_style`
--
ALTER TABLE `template_product_card_style`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_product_detail_style`
--
ALTER TABLE `template_product_detail_style`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_recommended_grid`
--
ALTER TABLE `template_recommended_grid`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_sections`
--
ALTER TABLE `template_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_section_unique` (`template_id`,`section_key`);

--
-- Índices de tabela `template_store_template`
--
ALTER TABLE `template_store_template`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_template_store_template_store` (`store_id`),
  ADD UNIQUE KEY `uk_template_store_template_store_id` (`store_id`),
  ADD UNIQUE KEY `uk_store_one_template` (`store_id`),
  ADD KEY `store_idx` (`store_id`),
  ADD KEY `template_idx` (`template_id`);

--
-- Índices de tabela `template_templates`
--
ALTER TABLE `template_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_unique` (`code`);

--
-- Índices de tabela `template_theme_settings`
--
ALTER TABLE `template_theme_settings`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `template_video_settings`
--
ALTER TABLE `template_video_settings`
  ADD PRIMARY KEY (`template_id`);

--
-- Índices de tabela `themes`
--
ALTER TABLE `themes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de tabela `admin_panel_settings`
--
ALTER TABLE `admin_panel_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `affiliate_clicks`
--
ALTER TABLE `affiliate_clicks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `affiliate_conversions`
--
ALTER TABLE `affiliate_conversions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `affiliate_payouts`
--
ALTER TABLE `affiliate_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `affiliate_profiles`
--
ALTER TABLE `affiliate_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de tabela `checkout_recommendations`
--
ALTER TABLE `checkout_recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `collections`
--
ALTER TABLE `collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `collection_items`
--
ALTER TABLE `collection_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `collection_products`
--
ALTER TABLE `collection_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de tabela `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de tabela `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `featured_images`
--
ALTER TABLE `featured_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de tabela `financial_transactions`
--
ALTER TABLE `financial_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `marketplace_catalog`
--
ALTER TABLE `marketplace_catalog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `marketplace_integrations`
--
ALTER TABLE `marketplace_integrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `marketplace_sync_logs`
--
ALTER TABLE `marketplace_sync_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de tabela `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de tabela `order_addresses`
--
ALTER TABLE `order_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `order_gateway_logs`
--
ALTER TABLE `order_gateway_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `order_logistics_history`
--
ALTER TABLE `order_logistics_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `plans`
--
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `plan_billing`
--
ALTER TABLE `plan_billing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `plan_features`
--
ALTER TABLE `plan_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de tabela `plan_limits`
--
ALTER TABLE `plan_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `platform_config`
--
ALTER TABLE `platform_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT de tabela `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=167;

--
-- AUTO_INCREMENT de tabela `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=469;

--
-- AUTO_INCREMENT de tabela `product_marketplace_map`
--
ALTER TABLE `product_marketplace_map`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `product_variations`
--
ALTER TABLE `product_variations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT de tabela `product_views`
--
ALTER TABLE `product_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de tabela `representatives`
--
ALTER TABLE `representatives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `representatives_certificates`
--
ALTER TABLE `representatives_certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `representatives_courses`
--
ALTER TABLE `representatives_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `representatives_lessons`
--
ALTER TABLE `representatives_lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `representatives_lesson_questions`
--
ALTER TABLE `representatives_lesson_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `representatives_modules`
--
ALTER TABLE `representatives_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `representatives_progress`
--
ALTER TABLE `representatives_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `shipping_distance_logs`
--
ALTER TABLE `shipping_distance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `shipping_fixed_config`
--
ALTER TABLE `shipping_fixed_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `shipping_local_delivery_config`
--
ALTER TABLE `shipping_local_delivery_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `shipping_melhor_envio_config`
--
ALTER TABLE `shipping_melhor_envio_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `shipping_melhor_envio_services`
--
ALTER TABLE `shipping_melhor_envio_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT de tabela `shipping_rules`
--
ALTER TABLE `shipping_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `shipping_service_settings`
--
ALTER TABLE `shipping_service_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `shipping_settings`
--
ALTER TABLE `shipping_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de tabela `site_customization`
--
ALTER TABLE `site_customization`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT de tabela `stats`
--
ALTER TABLE `stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de tabela `store_activity_log`
--
ALTER TABLE `store_activity_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `store_creation_context`
--
ALTER TABLE `store_creation_context`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de tabela `store_representatives`
--
ALTER TABLE `store_representatives`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `store_segments`
--
ALTER TABLE `store_segments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `store_subscriptions`
--
ALTER TABLE `store_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `subscription_changes`
--
ALTER TABLE `subscription_changes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `subscription_events`
--
ALTER TABLE `subscription_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de tabela `subscription_invoices`
--
ALTER TABLE `subscription_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `supreme_admins`
--
ALTER TABLE `supreme_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `supreme_messages`
--
ALTER TABLE `supreme_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `template_hero_slides`
--
ALTER TABLE `template_hero_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT de tabela `template_nav_items`
--
ALTER TABLE `template_nav_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=636;

--
-- AUTO_INCREMENT de tabela `template_sections`
--
ALTER TABLE `template_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `template_store_template`
--
ALTER TABLE `template_store_template`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `template_templates`
--
ALTER TABLE `template_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `themes`
--
ALTER TABLE `themes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `affiliate_clicks`
--
ALTER TABLE `affiliate_clicks`
  ADD CONSTRAINT `fk_affiliate_clicks_affiliate` FOREIGN KEY (`affiliate_profile_id`) REFERENCES `affiliate_profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_affiliate_clicks_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_affiliate_clicks_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `affiliate_conversions`
--
ALTER TABLE `affiliate_conversions`
  ADD CONSTRAINT `fk_affiliate_conversions_affiliate` FOREIGN KEY (`affiliate_profile_id`) REFERENCES `affiliate_profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_affiliate_conversions_click` FOREIGN KEY (`click_id`) REFERENCES `affiliate_clicks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_affiliate_conversions_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_affiliate_conversions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_affiliate_conversions_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `affiliate_payouts`
--
ALTER TABLE `affiliate_payouts`
  ADD CONSTRAINT `fk_affiliate_payouts_affiliate` FOREIGN KEY (`affiliate_profile_id`) REFERENCES `affiliate_profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_affiliate_payouts_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `affiliate_profiles`
--
ALTER TABLE `affiliate_profiles`
  ADD CONSTRAINT `fk_affiliate_profiles_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_affiliate_profiles_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `checkout_recommendations`
--
ALTER TABLE `checkout_recommendations`
  ADD CONSTRAINT `fk_checkout_recommendations_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_checkout_recommendations_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `fk_customer_address` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `featured_images`
--
ALTER TABLE `featured_images`
  ADD CONSTRAINT `featured_images_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `store_subscriptions` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `marketplace_integrations`
--
ALTER TABLE `marketplace_integrations`
  ADD CONSTRAINT `fk_marketplace_integrations_catalog` FOREIGN KEY (`marketplace_catalog_id`) REFERENCES `marketplace_catalog` (`id`),
  ADD CONSTRAINT `fk_marketplace_integrations_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `marketplace_sync_logs`
--
ALTER TABLE `marketplace_sync_logs`
  ADD CONSTRAINT `fk_marketplace_sync_logs_integration` FOREIGN KEY (`marketplace_integration_id`) REFERENCES `marketplace_integrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_marketplace_sync_logs_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `order_addresses`
--
ALTER TABLE `order_addresses`
  ADD CONSTRAINT `order_addresses_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `product_variations`
--
ALTER TABLE `product_variations`
  ADD CONSTRAINT `product_variations_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `product_views`
--
ALTER TABLE `product_views`
  ADD CONSTRAINT `product_views_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `representatives_certificates`
--
ALTER TABLE `representatives_certificates`
  ADD CONSTRAINT `representatives_certificates_ibfk_1` FOREIGN KEY (`representative_id`) REFERENCES `representatives` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `representatives_certificates_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `representatives_courses` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `representatives_lessons`
--
ALTER TABLE `representatives_lessons`
  ADD CONSTRAINT `representatives_lessons_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `representatives_modules` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `representatives_lesson_questions`
--
ALTER TABLE `representatives_lesson_questions`
  ADD CONSTRAINT `representatives_lesson_questions_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `representatives_lessons` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `representatives_modules`
--
ALTER TABLE `representatives_modules`
  ADD CONSTRAINT `representatives_modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `representatives_courses` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `representatives_progress`
--
ALTER TABLE `representatives_progress`
  ADD CONSTRAINT `representatives_progress_ibfk_1` FOREIGN KEY (`representative_id`) REFERENCES `representatives` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `representatives_progress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `representatives_courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `representatives_progress_ibfk_3` FOREIGN KEY (`module_id`) REFERENCES `representatives_modules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `representatives_progress_ibfk_4` FOREIGN KEY (`lesson_id`) REFERENCES `representatives_lessons` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `site_customization`
--
ALTER TABLE `site_customization`
  ADD CONSTRAINT `site_customization_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `fk_stores_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`);

--
-- Restrições para tabelas `store_activity_log`
--
ALTER TABLE `store_activity_log`
  ADD CONSTRAINT `store_activity_log_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `store_subscriptions`
--
ALTER TABLE `store_subscriptions`
  ADD CONSTRAINT `store_subscriptions_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `store_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`);

--
-- Restrições para tabelas `supreme_messages`
--
ALTER TABLE `supreme_messages`
  ADD CONSTRAINT `supreme_messages_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `template_product_detail_style`
--
ALTER TABLE `template_product_detail_style`
  ADD CONSTRAINT `fk_template_product_detail_style_template` FOREIGN KEY (`template_id`) REFERENCES `template_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

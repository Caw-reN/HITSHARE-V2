<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Setting;
use App\Models\Website;
use App\Models\WebsiteAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Default Super Admin
        Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'password' => Hash::make('admin123'),
                'role'     => 'superadmin',
            ]
        );

        // 2. Default Settings
        $defaultSettings = [
            'site_name'               => 'HitShare',
            'whatsapp_number'         => '6281234567890',
            'contact_message'         => 'Halo Admin HitShare, saya butuh bantuan terkait langganan.',
            'registration_enabled'    => 'true',
            'plan_monthly_price'      => '25000',
            'plan_monthly_days'       => '30',
            'plan_monthly_original'   => '35000',
            'plan_6months_price'      => '120000',
            'plan_6months_days'       => '180',
            'plan_6months_original'   => '150000',
            'plan_yearly_price'       => '200000',
            'plan_yearly_days'        => '365',
            'plan_yearly_original'    => '300000',
            'paymenku_api_key'        => '',
            'paymenku_webhook_secret' => '',
            'paymenku_is_production'  => 'false',
            'logo_url'                => '',
            'favicon_url'             => '',
            'extension_download_url'  => '/downloads/extension.zip',
            'extension_file_size'     => '365 KB',
            'extension_updated_at'    => now()->toISOString(),
        ];

        foreach ($defaultSettings as $key => $val) {
            Setting::updateOrCreate(['key' => $key], ['value' => $val]);
        }

        // 3. Default Categories
        $categoriesData = [
            'Streaming'        => ['icon' => 'Tv', 'sort_order' => 1],
            'Produktivitas'    => ['icon' => 'Briefcase', 'sort_order' => 2],
            'Desain & Kreatif' => ['icon' => 'Palette', 'sort_order' => 3],
            'AI & Tools'       => ['icon' => 'Sparkles', 'sort_order' => 4],
            'Edukasi'          => ['icon' => 'GraduationCap', 'sort_order' => 5],
            'Musik'            => ['icon' => 'Headphones', 'sort_order' => 6],
        ];

        $categories = [];
        foreach ($categoriesData as $name => $meta) {
            $categories[$name] = Category::firstOrCreate(
                ['name' => $name],
                ['icon' => $meta['icon'], 'sort_order' => $meta['sort_order']]
            );
        }

        // 4. Sample Websites & Multi-Accounts
        $websitesData = [
            [
                'name'     => 'Netflix',
                'category' => 'Streaming',
                'icon'     => 'https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico',
                'url'      => 'https://www.netflix.com/browse',
                'accounts' => ['Akun Ultra HD 1', 'Akun Ultra HD 2', 'Akun Cadangan 3'],
            ],
            [
                'name'     => 'Canva Pro',
                'category' => 'Desain & Kreatif',
                'icon'     => 'https://www.canva.com/favicon.ico',
                'url'      => 'https://www.canva.com',
                'accounts' => ['Akun Desain 1', 'Akun Desain 2'],
            ],
            [
                'name'     => 'ChatGPT Plus',
                'category' => 'AI & Tools',
                'icon'     => 'https://chatgpt.com/favicon.ico',
                'url'      => 'https://chatgpt.com',
                'accounts' => ['Akun Plus 1', 'Akun Plus 2'],
            ],
            [
                'name'     => 'Prime Video',
                'category' => 'Streaming',
                'icon'     => 'https://www.primevideo.com/favicon.ico',
                'url'      => 'https://www.primevideo.com',
                'accounts' => ['Akun Utama'],
            ],
            [
                'name'     => 'Grammarly Premium',
                'category' => 'Produktivitas',
                'icon'     => 'https://www.grammarly.com/favicon.ico',
                'url'      => 'https://app.grammarly.com',
                'accounts' => ['Akun Edu 1'],
            ],
            [
                'name'     => 'Spotify Premium',
                'category' => 'Musik',
                'icon'     => 'https://open.spotify.com/favicon.ico',
                'url'      => 'https://open.spotify.com',
                'accounts' => ['Akun Family 1', 'Akun Family 2'],
            ],
            [
                'name'     => 'Coursera Plus',
                'category' => 'Edukasi',
                'icon'     => 'https://www.coursera.org/favicon.ico',
                'url'      => 'https://www.coursera.org',
                'accounts' => ['Akun Belajar 1'],
            ],
        ];

        foreach ($websitesData as $wData) {
            $cat = $categories[$wData['category']] ?? null;
            if (!$cat) continue;

            $website = Website::firstOrCreate(
                ['name' => $wData['name']],
                [
                    'category_id' => $cat->id,
                    'icon'        => $wData['icon'],
                    'url'         => $wData['url'],
                    'is_active'   => true,
                ]
            );

            foreach ($wData['accounts'] as $accLabel) {
                WebsiteAccount::firstOrCreate(
                    [
                        'website_id' => $website->id,
                        'label'      => $accLabel,
                    ],
                    [
                        'cookie_data'       => json_encode([
                            [
                                'name'   => 'demo_session',
                                'value'  => 'sample_token_value',
                                'domain' => parse_url($wData['url'], PHP_URL_HOST),
                            ]
                        ]),
                        'cookie_updated_at' => now(),
                        'is_active'         => true,
                    ]
                );
            }
        }
    }
}

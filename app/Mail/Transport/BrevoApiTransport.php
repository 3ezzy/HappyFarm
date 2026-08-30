<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

/**
 * Sends mail through Brevo's Transactional Email API (POST /v3/smtp/email)
 * instead of SMTP. Registered as a Symfony Mailer transport via
 * Mail::extend('brevo', ...) in AppServiceProvider — every existing
 * Mail/Notification call, including Laravel's password reset broker,
 * keeps working completely unchanged; only the delivery mechanism swaps.
 */
class BrevoApiTransport extends AbstractTransport
{
    private const API_URL = 'https://api.brevo.com/v3/smtp/email';

    public function __construct(
        private readonly ?string $apiKey,
        private readonly ?string $fromEmail,
        private readonly ?string $fromName,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $response = Http::withHeaders([
            'api-key' => $this->apiKey,
            'accept' => 'application/json',
        ])->post(self::API_URL, $this->buildPayload($email));

        if ($response->failed()) {
            // Brevo's JSON error body only ever contains a "code" and
            // "message" — the api-key is sent as a request header and is
            // never echoed back, so this is safe to log and to surface in
            // the exception without exposing any secret.
            $status = $response->status();
            $brevoCode = $response->json('code') ?? 'unknown_code';
            $brevoMessage = $response->json('message') ?? 'unknown error';

            Log::error('Brevo API transactional email send failed.', [
                'http_status' => $status,
                'brevo_code' => $brevoCode,
                'brevo_message' => $brevoMessage,
            ]);

            throw new TransportException(
                "Brevo API request failed with status {$status}: [{$brevoCode}] {$brevoMessage}"
            );
        }
    }

    private function buildPayload(Email $email): array
    {
        $payload = [
            'sender' => ['email' => $this->fromEmail, 'name' => $this->fromName],
            'to' => $this->addressList($email->getTo()),
            'subject' => (string) $email->getSubject(),
        ];

        if ($html = $email->getHtmlBody()) {
            $payload['htmlContent'] = $html;
        }

        if ($text = $email->getTextBody()) {
            $payload['textContent'] = $text;
        }

        if ($cc = $this->addressList($email->getCc())) {
            $payload['cc'] = $cc;
        }

        if ($bcc = $this->addressList($email->getBcc())) {
            $payload['bcc'] = $bcc;
        }

        if ($replyTo = $this->addressList($email->getReplyTo())) {
            $payload['replyTo'] = $replyTo[0];
        }

        return $payload;
    }

    /**
     * @param  Address[]  $addresses
     */
    private function addressList(array $addresses): array
    {
        return array_map(fn (Address $address) => array_filter([
            'email' => $address->getAddress(),
            'name' => $address->getName() ?: null,
        ]), $addresses);
    }

    public function __toString(): string
    {
        return 'brevo+api://api.brevo.com';
    }
}

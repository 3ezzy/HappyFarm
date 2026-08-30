<?php

namespace Tests\Unit;

use App\Mail\Transport\BrevoApiTransport;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

/**
 * Extends the Laravel-aware TestCase (not plain PHPUnit) because this
 * exercises Http::fake()/Log facades, which need the container booted.
 */
class BrevoApiTransportTest extends TestCase
{
    private function makeEmail(): Email
    {
        return (new Email())
            ->from('sender@example.com')
            ->to('recipient@example.com')
            ->subject('Test subject')
            ->html('<p>Hello</p>')
            ->text('Hello');
    }

    /**
     * Proves the full wiring, not just the class in isolation: config/mail.php's
     * "brevo" mailer + AppServiceProvider's Mail::extend('brevo', ...) must
     * actually connect through Laravel's MailManager.
     */
    public function test_the_brevo_mailer_is_registered_and_resolves_to_this_transport()
    {
        config(['mail.default' => 'brevo']);

        $transport = Mail::mailer('brevo')->getSymfonyTransport();

        $this->assertInstanceOf(BrevoApiTransport::class, $transport);
    }

    public function test_it_sends_via_the_brevo_api_with_the_expected_payload_and_headers()
    {
        Http::fake([
            'api.brevo.com/*' => Http::response(['messageId' => 'abc123'], 201),
        ]);

        $transport = new BrevoApiTransport('test-api-key', 'from@example.com', 'HappyFarm QA');
        $transport->send($this->makeEmail());

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.brevo.com/v3/smtp/email'
                && $request->hasHeader('api-key', 'test-api-key')
                && $request['sender'] === ['email' => 'from@example.com', 'name' => 'HappyFarm QA']
                && $request['to'] === [['email' => 'recipient@example.com']]
                && $request['subject'] === 'Test subject'
                && $request['htmlContent'] === '<p>Hello</p>'
                && $request['textContent'] === 'Hello';
        });
    }

    public function test_omits_cc_bcc_and_reply_to_when_the_message_has_none()
    {
        Http::fake(['api.brevo.com/*' => Http::response(['messageId' => 'abc123'], 201)]);

        $transport = new BrevoApiTransport('test-api-key', 'from@example.com', 'HappyFarm QA');
        $transport->send($this->makeEmail());

        Http::assertSent(function ($request) {
            return ! array_key_exists('cc', $request->data())
                && ! array_key_exists('bcc', $request->data())
                && ! array_key_exists('replyTo', $request->data());
        });
    }

    /**
     * A failed Brevo response (auth failure, bad request, etc.) must throw
     * a TransportException carrying only Brevo's code/message — never the
     * api-key — so the existing AuthController guard can log it safely and
     * still return the generic forgot-password response to the caller.
     */
    public function test_a_failed_brevo_response_throws_a_sanitized_exception_and_logs_without_the_api_key()
    {
        Http::fake([
            'api.brevo.com/*' => Http::response(['code' => 'unauthorized', 'message' => 'Key not found'], 401),
        ]);
        Log::spy();

        $transport = new BrevoApiTransport('super-secret-key-value', 'from@example.com', 'HappyFarm QA');

        try {
            $transport->send($this->makeEmail());
            $this->fail('Expected a TransportException to be thrown.');
        } catch (TransportException $e) {
            $this->assertStringContainsString('unauthorized', $e->getMessage());
            $this->assertStringContainsString('Key not found', $e->getMessage());
            $this->assertStringNotContainsString('super-secret-key-value', $e->getMessage());
        }

        Log::shouldHaveReceived('error')->once()->withArgs(function ($message, $context) {
            $encoded = $message . json_encode($context);

            return str_contains($message, 'Brevo API transactional email send failed.')
                && ! str_contains($encoded, 'super-secret-key-value');
        });
    }
}
